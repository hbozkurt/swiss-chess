import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from '../db/client';
import * as gameRepo from '../repositories/game-repo';
import * as playerRepo from '../repositories/player-repo';
import * as roundRepo from '../repositories/round-repo';
import * as tournamentRepo from '../repositories/tournament-repo';
import { createTestDb } from './test-db';
import { generateNextRound, getStandings, updateGameResult } from './tournament-service';

let db: Db;

beforeEach(() => {
  db = createTestDb();
});

function setUpTournament(playerCount: number, totalRounds: number) {
  const tournament = tournamentRepo.createTournament(db, { name: 'Test Open', totalRounds });
  const players = playerRepo.addPlayers(
    db,
    tournament.id,
    Array.from({ length: playerCount }, (_, i) => ({ name: `Player ${i}`, rating: 1500 + i * 10 })),
  );
  return { tournament, players };
}

async function playRound(tournamentId: string, resultFor: (white: string, black: string) => number = () => 1) {
  const result = await generateNextRound(db, tournamentId);
  const rounds = roundRepo.findLiveRounds(db, tournamentId);
  const round = rounds[rounds.length - 1]!;
  const games = gameRepo.getGamesByRound(db, round.id);
  for (const g of games) {
    if (g.result !== null) continue; // bye games already have a result
    await updateGameResult(db, g.id, { result: resultFor(g.whitePlayerId, g.blackPlayerId!), kind: null });
  }
  return { result, round };
}

describe('generateNextRound', () => {
  it('pairs an odd player count with exactly one forced bye and persists a live round', async () => {
    const { tournament } = setUpTournament(5, 3);
    const { result, round } = await playRound(tournament.id);

    expect(result.roundNumber).toBe(1);
    expect(result.pairings).toHaveLength(2);
    expect(result.byes).toHaveLength(1);

    const games = gameRepo.getGamesByRound(db, round.id);
    expect(games).toHaveLength(3); // 2 pairings + 1 bye
    expect(games.every((g) => g.result !== null)).toBe(true);
  });

  it('rejects generating another round once total_rounds is reached', async () => {
    const { tournament } = setUpTournament(4, 1);
    await playRound(tournament.id);
    await expect(generateNextRound(db, tournament.id)).rejects.toThrow(/already reached/);
  });

  it('excludes withdrawn players from future pairings', async () => {
    const { tournament, players } = setUpTournament(4, 2);
    playerRepo.withdrawPlayer(db, players[0]!.id);

    const { result } = await playRound(tournament.id);
    const pairedIds = result.pairings.flatMap((p) => [p.white, p.black]);
    expect(pairedIds).not.toContain(players[0]!.id);
  });
});

describe('full tournament lifecycle: pair -> result -> edit -> cascade -> re-pair', () => {
  it('invalidates later rounds when a past result is edited, and allows a clean re-pair after', async () => {
    const { tournament } = setUpTournament(4, 3);

    await playRound(tournament.id); // round 1
    await playRound(tournament.id); // round 2
    const round1 = roundRepo.findLiveRounds(db, tournament.id)[0]!;
    const round1Games = gameRepo.getGamesByRound(db, round1.id);
    const gameToEdit = round1Games[0]!;

    // Editing round 1 after round 2 exists must require confirmation first.
    const preview = await updateGameResult(db, gameToEdit.id, { result: 0, kind: null });
    expect(preview.status).toBe('confirmation_required');
    if (preview.status !== 'confirmation_required') throw new Error('unreachable');
    expect(preview.preview.affectedRoundNumbers).toEqual([2]);
    expect(preview.preview.affectedGameCount).toBeGreaterThan(0);

    // Round 2 must still be live (unaffected) until the arbiter confirms.
    expect(roundRepo.findLiveRounds(db, tournament.id)).toHaveLength(2);

    const applied = await updateGameResult(db, gameToEdit.id, { result: 0, kind: null }, { confirmed: true });
    expect(applied.status).toBe('applied');

    // Round 2 is now invalidated (no longer live); round 1 remains, with the edited result.
    const liveAfterCascade = roundRepo.findLiveRounds(db, tournament.id);
    expect(liveAfterCascade.map((r) => r.roundNumber)).toEqual([1]);
    const editedGame = gameRepo.findGameById(db, gameToEdit.id)!;
    expect(editedGame.result).toBe(0);

    // Re-pairing creates a fresh round 2 (the partial unique index must allow this
    // despite the invalidated round 2 row still existing).
    const { round: newRound2 } = await playRound(tournament.id);
    expect(newRound2.roundNumber).toBe(2);
    expect(roundRepo.findLiveRounds(db, tournament.id).map((r) => r.roundNumber)).toEqual([1, 2]);
  });

  it('does not require confirmation when editing the latest round', async () => {
    const { tournament } = setUpTournament(4, 2);
    await playRound(tournament.id);
    const round1 = roundRepo.findLiveRounds(db, tournament.id)[0]!;
    const game = gameRepo.getGamesByRound(db, round1.id)[0]!;

    const outcome = await updateGameResult(db, game.id, { result: 0.5, kind: null });
    expect(outcome.status).toBe('applied');
    expect(gameRepo.findGameById(db, game.id)!.result).toBe(0.5);
  });
});

describe('tournament status transitions', () => {
  it('moves from setup -> in_progress -> completed as rounds are played out', async () => {
    const { tournament } = setUpTournament(4, 2);
    expect(tournamentRepo.getTournament(db, tournament.id)!.status).toBe('setup');

    await generateNextRound(db, tournament.id); // round 1, no results entered yet
    expect(tournamentRepo.getTournament(db, tournament.id)!.status).toBe('in_progress');

    const round1 = roundRepo.findLiveRounds(db, tournament.id)[0]!;
    const round1Games = gameRepo.getGamesByRound(db, round1.id).filter((g) => g.blackPlayerId !== null);

    // Enter only one of the two results — tournament must still be in_progress.
    await updateGameResult(db, round1Games[0]!.id, { result: 1, kind: null });
    expect(tournamentRepo.getTournament(db, tournament.id)!.status).toBe('in_progress');

    await updateGameResult(db, round1Games[1]!.id, { result: 1, kind: null });
    expect(tournamentRepo.getTournament(db, tournament.id)!.status).toBe('in_progress'); // round 2 still to come

    await playRound(tournament.id);
    expect(tournamentRepo.getTournament(db, tournament.id)!.status).toBe('completed');
  });

  it('reverts to in_progress when a cascade invalidates rounds after completion', async () => {
    const { tournament } = setUpTournament(4, 2);
    await playRound(tournament.id);
    await playRound(tournament.id);
    expect(tournamentRepo.getTournament(db, tournament.id)!.status).toBe('completed');

    const round1 = roundRepo.findLiveRounds(db, tournament.id)[0]!;
    const gameToEdit = gameRepo.getGamesByRound(db, round1.id)[0]!;
    await updateGameResult(db, gameToEdit.id, { result: 0, kind: null }, { confirmed: true });

    expect(tournamentRepo.getTournament(db, tournament.id)!.status).toBe('in_progress');
  });
});

describe('getStandings', () => {
  it('ranks an undefeated player first and credits bye points toward score', async () => {
    const { tournament, players } = setUpTournament(5, 1);
    await playRound(tournament.id, (white) => (white === players[0]!.id ? 1 : 1)); // white always wins

    const standings = await getStandings(db, tournament.id);
    expect(standings).toHaveLength(5);
    const totalScore = standings.reduce((sum, s) => sum + s.score, 0);
    // 2 decisive games (1 point awarded each) + 1 full-point bye = 3 points distributed.
    expect(totalScore).toBe(3);
    expect(standings[0]!.rank).toBe(1);
  });
});
