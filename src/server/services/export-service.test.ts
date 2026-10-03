import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from '../db/client';
import * as playerRepo from '../repositories/player-repo';
import * as tournamentRepo from '../repositories/tournament-repo';
import { createTestDb } from './test-db';
import { exportPlayersCsv, exportResultsCsv, exportStandingsCsv, renderPairingSheetPdf, renderStandingsPdf } from './export-service';
import { generateNextRound, updateGameResult } from './tournament-service';
import * as gameRepo from '../repositories/game-repo';
import * as roundRepo from '../repositories/round-repo';

let db: Db;

beforeEach(() => {
  db = createTestDb();
});

async function setUpPlayedRound() {
  const tournament = tournamentRepo.createTournament(db, { name: 'Export Test Open', totalRounds: 1 });
  playerRepo.addPlayers(db, tournament.id, [
    { name: 'Alice', rating: 2000 },
    { name: 'Bob', rating: 1900 },
    { name: 'Carol', rating: 1800 },
  ]);
  await generateNextRound(db, tournament.id);
  const round = roundRepo.findLiveRounds(db, tournament.id)[0]!;
  for (const g of gameRepo.getGamesByRound(db, round.id)) {
    if (g.result === null) await updateGameResult(db, g.id, { result: 1, kind: null });
  }
  return tournament;
}

describe('CSV exports', () => {
  it('exports players with name/rating columns', async () => {
    const tournament = await setUpPlayedRound();
    const csv = exportPlayersCsv(db, tournament.id);
    expect(csv).toContain('name,rating,withdrawn');
    expect(csv).toContain('Alice,2000');
  });

  it('exports results with round/board/white/black/result', async () => {
    const tournament = await setUpPlayedRound();
    const csv = exportResultsCsv(db, tournament.id);
    expect(csv).toContain('round,board,white,black,result,kind');
    expect(csv).toMatch(/1,1,.+,.+,/);
  });

  it('exports standings sorted by rank', async () => {
    const tournament = await setUpPlayedRound();
    const csv = exportStandingsCsv(db, tournament.id);
    const lines = (await csv).trim().split('\n');
    expect(lines[0]).toContain('rank,name,rating,score');
    expect(lines.length).toBe(4); // header + 3 players
  });
});

describe('PDF exports', () => {
  it('renders a non-empty pairing sheet PDF buffer', async () => {
    const tournament = await setUpPlayedRound();
    const buffer = await renderPairingSheetPdf(db, tournament.id, 1);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(100);
    expect(buffer.subarray(0, 4).toString('latin1')).toBe('%PDF');
  });

  it('renders a non-empty standings PDF buffer', async () => {
    const tournament = await setUpPlayedRound();
    const buffer = await renderStandingsPdf(db, tournament.id);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.subarray(0, 4).toString('latin1')).toBe('%PDF');
  });
});
