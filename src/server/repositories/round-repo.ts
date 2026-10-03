import { and, asc, eq, gt, inArray, isNull } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import type { DbOrTx } from '../db/client';
import { rounds } from '../db/schema';

export type RoundStatus = 'pending' | 'paired' | 'completed' | 'invalidated';

export interface RoundRow {
  id: string;
  tournamentId: string;
  roundNumber: number;
  status: RoundStatus;
  pairedAt: string | null;
  completedAt: string | null;
  invalidatedAt: string | null;
}

const liveRound = isNull(rounds.invalidatedAt);

export function createRound(db: DbOrTx, input: { tournamentId: string; roundNumber: number }): RoundRow {
  const [row] = db
    .insert(rounds)
    .values({
      id: uuid(),
      tournamentId: input.tournamentId,
      roundNumber: input.roundNumber,
      status: 'paired',
      pairedAt: new Date().toISOString(),
    })
    .returning()
    .all();
  return row as RoundRow;
}

export function findLiveRounds(db: DbOrTx, tournamentId: string): RoundRow[] {
  return db
    .select()
    .from(rounds)
    .where(and(eq(rounds.tournamentId, tournamentId), liveRound))
    .orderBy(asc(rounds.roundNumber))
    .all() as RoundRow[];
}

export function findById(db: DbOrTx, roundId: string): RoundRow | undefined {
  return db.select().from(rounds).where(eq(rounds.id, roundId)).all()[0] as RoundRow | undefined;
}

export function findLiveRoundsAfter(db: DbOrTx, tournamentId: string, roundNumber: number): RoundRow[] {
  return db
    .select()
    .from(rounds)
    .where(and(eq(rounds.tournamentId, tournamentId), liveRound, gt(rounds.roundNumber, roundNumber)))
    .orderBy(asc(rounds.roundNumber))
    .all() as RoundRow[];
}

export function markCompleted(db: DbOrTx, roundId: string): void {
  db.update(rounds).set({ status: 'completed', completedAt: new Date().toISOString() }).where(eq(rounds.id, roundId)).run();
}

export function softInvalidate(db: DbOrTx, roundIds: string[]): void {
  if (roundIds.length === 0) return;
  db.update(rounds)
    .set({ status: 'invalidated', invalidatedAt: new Date().toISOString() })
    .where(inArray(rounds.id, roundIds))
    .run();
}
