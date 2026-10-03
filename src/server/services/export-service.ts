import { createElement } from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import type { ReactElement } from 'react';
import { stringify } from 'csv-stringify/sync';
import { PairingSheetDocument } from '@/components/pdf/PairingSheetDocument';
import { StandingsDocument } from '@/components/pdf/StandingsDocument';
import type { Db } from '../db/client';
import * as gameRepo from '../repositories/game-repo';
import * as playerRepo from '../repositories/player-repo';
import * as roundRepo from '../repositories/round-repo';
import * as tournamentRepo from '../repositories/tournament-repo';
import { getStandings } from './tournament-service';

function playerNameMap(db: Db, tournamentId: string): Map<string, { name: string; rating: number | null }> {
  const players = playerRepo.listPlayers(db, tournamentId);
  return new Map(players.map((p) => [p.id, { name: p.name, rating: p.rating }]));
}

export function exportPlayersCsv(db: Db, tournamentId: string): string {
  const players = playerRepo.listPlayers(db, tournamentId);
  return stringify(
    players.map((p) => ({ name: p.name, rating: p.rating ?? '', withdrawn: p.withdrawnAt !== null ? 'yes' : '' })),
    { header: true, columns: ['name', 'rating', 'withdrawn'] },
  );
}

export function exportResultsCsv(db: Db, tournamentId: string): string {
  const names = playerNameMap(db, tournamentId);
  const rounds = roundRepo.findLiveRounds(db, tournamentId);
  const rows: Record<string, string | number>[] = [];
  for (const round of rounds) {
    const games = gameRepo.getGamesByRound(db, round.id);
    for (const g of games) {
      rows.push({
        round: round.roundNumber,
        board: g.boardNumber,
        white: names.get(g.whitePlayerId)?.name ?? g.whitePlayerId,
        black: g.blackPlayerId ? (names.get(g.blackPlayerId)?.name ?? g.blackPlayerId) : 'bye',
        result: g.result ?? '',
        kind: g.kind ?? '',
      });
    }
  }
  return stringify(rows, { header: true, columns: ['round', 'board', 'white', 'black', 'result', 'kind'] });
}

export async function exportStandingsCsv(db: Db, tournamentId: string): Promise<string> {
  const names = playerNameMap(db, tournamentId);
  const standings = await getStandings(db, tournamentId);
  const rows = standings.map((s) => ({
    rank: s.rank,
    name: names.get(s.playerId)?.name ?? s.playerId,
    rating: names.get(s.playerId)?.rating ?? '',
    score: s.score,
    buchholz_cut1: s.buchholzCut1,
    sonneborn_berger: s.sonnebornBerger,
    direct_encounter: s.directEncounter,
    wins: s.wins,
    black_games: s.blackGames,
  }));
  return stringify(rows, {
    header: true,
    columns: ['rank', 'name', 'rating', 'score', 'buchholz_cut1', 'sonneborn_berger', 'direct_encounter', 'wins', 'black_games'],
  });
}

export async function renderPairingSheetPdf(db: Db, tournamentId: string, roundNumber: number): Promise<Buffer> {
  const tournament = tournamentRepo.getTournament(db, tournamentId);
  if (!tournament) throw new Error(`tournament not found: ${tournamentId}`);
  const names = playerNameMap(db, tournamentId);
  const round = roundRepo.findLiveRounds(db, tournamentId).find((r) => r.roundNumber === roundNumber);
  if (!round) throw new Error(`round ${roundNumber} not found (or invalidated)`);
  const games = gameRepo.getGamesByRound(db, round.id);

  const rows = games.map((g) => ({
    board: g.boardNumber,
    white: names.get(g.whitePlayerId)?.name ?? g.whitePlayerId,
    black: g.blackPlayerId ? (names.get(g.blackPlayerId)?.name ?? g.blackPlayerId) : null,
    result: g.result === null ? '' : String(g.result),
  }));

  return renderToBuffer(
    createElement(PairingSheetDocument, { tournamentName: tournament.name, roundNumber, rows }) as ReactElement<DocumentProps>,
  );
}

export async function renderStandingsPdf(db: Db, tournamentId: string): Promise<Buffer> {
  const tournament = tournamentRepo.getTournament(db, tournamentId);
  if (!tournament) throw new Error(`tournament not found: ${tournamentId}`);
  const names = playerNameMap(db, tournamentId);
  const standings = await getStandings(db, tournamentId);

  const rows = standings.map((s) => ({
    rank: s.rank,
    name: names.get(s.playerId)?.name ?? s.playerId,
    rating: names.get(s.playerId)?.rating ?? null,
    score: s.score,
    buchholzCut1: s.buchholzCut1,
    sonnebornBerger: s.sonnebornBerger,
    directEncounter: s.directEncounter,
    wins: s.wins,
    blackGames: s.blackGames,
  }));

  return renderToBuffer(createElement(StandingsDocument, { tournamentName: tournament.name, rows }) as ReactElement<DocumentProps>);
}
