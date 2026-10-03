import { v4 as uuid } from 'uuid';
import type { Db, DbOrTx } from '../db/client';
import { pairingInvalidations } from '../db/schema';
import { toEchecsGames, toEchecsPlayer, toEchecsPlayers } from '../domain/pairing-adapter';
import { planNextRound, type RequestedBye } from '../domain/tournament-engine';
import { computeStandings } from '../domain/tiebreaks';
import type { GameKind, RankedStanding } from '../domain/types';
import * as gameRepo from '../repositories/game-repo';
import * as playerRepo from '../repositories/player-repo';
import * as roundRepo from '../repositories/round-repo';
import * as tournamentRepo from '../repositories/tournament-repo';

function loadLiveGameHistory(db: DbOrTx, tournamentId: string) {
  const liveRounds = roundRepo.findLiveRounds(db, tournamentId);
  const gamesByRound = liveRounds.map((r) => gameRepo.getGamesByRound(db, r.id));
  return { liveRounds, gamesByRound };
}

export interface GenerateRoundResult {
  roundNumber: number;
  pairings: { white: string; black: string }[];
  byes: { player: string; kind: string }[];
}

/** Generates and persists the next round's pairings for an in-progress tournament. */
export async function generateNextRound(
  db: Db,
  tournamentId: string,
  requestedByes: RequestedBye[] = [],
): Promise<GenerateRoundResult> {
  const tournament = tournamentRepo.getTournament(db, tournamentId);
  if (!tournament) throw new Error(`tournament not found: ${tournamentId}`);

  const activePlayers = playerRepo.listActivePlayers(db, tournamentId);
  const { liveRounds, gamesByRound } = loadLiveGameHistory(db, tournamentId);

  if (liveRounds.length >= tournament.totalRounds) {
    throw new Error('tournament has already reached its total round count');
  }

  const echecsPlayers = toEchecsPlayers(activePlayers);
  const echecsGames = toEchecsGames(gamesByRound);
  const plan = planNextRound(echecsPlayers, echecsGames, requestedByes);

  let board = 1;
  const newGames: gameRepo.NewGame[] = [];
  for (const p of plan.pairings) {
    newGames.push({ boardNumber: board++, whitePlayerId: p.white, blackPlayerId: p.black, result: null, kind: null });
  }
  for (const b of plan.forcedByes) {
    newGames.push({ boardNumber: board++, whitePlayerId: b.player, blackPlayerId: null, result: 1, kind: 'full-bye' });
  }
  for (const b of plan.requestedByes) {
    const result = b.kind === 'half-bye' ? 0.5 : 0;
    newGames.push({ boardNumber: board++, whitePlayerId: b.playerId, blackPlayerId: null, result, kind: b.kind });
  }

  const roundNumber = db.transaction((tx) => {
    const round = roundRepo.createRound(tx, { tournamentId, roundNumber: liveRounds.length + 1 });
    gameRepo.insertGamesForRound(tx, { roundId: round.id, tournamentId, games: newGames });
    tournamentRepo.setTournamentStatus(tx, tournamentId, 'in_progress');
    return round.roundNumber;
  });

  return {
    roundNumber,
    pairings: plan.pairings,
    byes: [
      ...plan.forcedByes.map((b) => ({ player: b.player, kind: 'full-bye' })),
      ...plan.requestedByes.map((b) => ({ player: b.playerId, kind: b.kind })),
    ],
  };
}

export interface ResultEditPreview {
  requiresConfirmation: boolean;
  affectedRoundNumbers: number[];
  affectedGameCount: number;
}

function previewCascade(db: DbOrTx, tournamentId: string, roundNumber: number): ResultEditPreview {
  const laterRounds = roundRepo.findLiveRoundsAfter(db, tournamentId, roundNumber);
  if (laterRounds.length === 0) {
    return { requiresConfirmation: false, affectedRoundNumbers: [], affectedGameCount: 0 };
  }
  const affectedGameCount = gameRepo.countGamesForRounds(
    db,
    laterRounds.map((r) => r.id),
  );
  return {
    requiresConfirmation: true,
    affectedRoundNumbers: laterRounds.map((r) => r.roundNumber),
    affectedGameCount,
  };
}

export type UpdateResultOutcome = { status: 'confirmation_required'; preview: ResultEditPreview } | { status: 'applied' };

/**
 * Marks the given round `completed` once every one of its games has a
 * result, and recomputes the tournament's overall status: `completed` once
 * every live round up to `totalRounds` has every game resolved, `in_progress`
 * otherwise. Called after every result write so the tournament doesn't get
 * stuck `in_progress` once the final round's last result is entered.
 */
function recomputeCompletionStatus(tx: DbOrTx, tournamentId: string, roundId: string): void {
  const roundGames = gameRepo.getGamesByRound(tx, roundId);
  if (roundGames.length > 0 && roundGames.every((g) => g.result !== null)) {
    roundRepo.markCompleted(tx, roundId);
  }

  const tournament = tournamentRepo.getTournament(tx, tournamentId);
  if (!tournament) return;
  const liveRounds = roundRepo.findLiveRounds(tx, tournamentId);
  const allRoundsResolved =
    liveRounds.length === tournament.totalRounds &&
    liveRounds.every((r) => {
      const games = gameRepo.getGamesByRound(tx, r.id);
      return games.length > 0 && games.every((g) => g.result !== null);
    });
  tournamentRepo.setTournamentStatus(tx, tournamentId, allRoundsResolved ? 'completed' : 'in_progress');
}

/**
 * Updates a game's result. If live rounds exist after the game's round, the
 * caller must pass `confirmed: true` (after showing the arbiter the preview)
 * — the update then cascades: later rounds are soft-invalidated and an audit
 * row records what happened, before the result itself is written. All of
 * this runs in one transaction with a strictly synchronous callback — the
 * better-sqlite3 driver underneath requires that: an async callback (or one
 * that calls unawaited async helpers) can commit before its writes actually run.
 */
export async function updateGameResult(
  db: Db,
  gameId: string,
  update: { result: number | null; kind: GameKind | null },
  options: { confirmed?: boolean; note?: string } = {},
): Promise<UpdateResultOutcome> {
  const game = gameRepo.findGameById(db, gameId);
  if (!game) throw new Error(`game not found: ${gameId}`);
  const round = roundRepo.findById(db, game.roundId);
  if (!round) throw new Error(`round not found: ${game.roundId}`);

  const preview = previewCascade(db, round.tournamentId, round.roundNumber);
  if (preview.requiresConfirmation && !options.confirmed) {
    return { status: 'confirmation_required', preview };
  }

  db.transaction((tx) => {
    if (preview.requiresConfirmation) {
      const laterRounds = roundRepo.findLiveRoundsAfter(tx, round.tournamentId, round.roundNumber);
      tx.insert(pairingInvalidations)
        .values({
          id: uuid(),
          tournamentId: round.tournamentId,
          sourceRoundNumber: round.roundNumber,
          invalidatedRounds: laterRounds.map((r) => r.roundNumber),
          invalidatedGames: preview.affectedGameCount,
          note: options.note ?? null,
        })
        .run();
      roundRepo.softInvalidate(
        tx,
        laterRounds.map((r) => r.id),
      );
    }
    gameRepo.auditedUpdateResult(tx, gameId, update);
    recomputeCompletionStatus(tx, round.tournamentId, round.id);
  });

  return { status: 'applied' };
}

export async function getStandings(db: Db, tournamentId: string): Promise<RankedStanding[]> {
  const allPlayers = playerRepo.listPlayers(db, tournamentId);
  const { gamesByRound } = loadLiveGameHistory(db, tournamentId);
  return computeStandings(allPlayers.map(toEchecsPlayer), toEchecsGames(gamesByRound));
}
