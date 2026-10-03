import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import type { DbOrTx } from '../db/client';
import { tournaments } from '../db/schema';

export type TournamentStatus = 'setup' | 'in_progress' | 'completed';

export interface Tournament {
  id: string;
  name: string;
  totalRounds: number;
  status: TournamentStatus;
  tiebreakOrder: string[];
  createdAt: string;
  updatedAt: string;
}

export function createTournament(db: DbOrTx, input: { name: string; totalRounds: number }): Tournament {
  const [row] = db
    .insert(tournaments)
    .values({ id: uuid(), name: input.name, totalRounds: input.totalRounds })
    .returning()
    .all();
  return row as Tournament;
}

export function listTournaments(db: DbOrTx): Tournament[] {
  return db.select().from(tournaments).all() as Tournament[];
}

export function getTournament(db: DbOrTx, id: string): Tournament | undefined {
  return db.select().from(tournaments).where(eq(tournaments.id, id)).all()[0] as Tournament | undefined;
}

export function setTournamentStatus(db: DbOrTx, id: string, status: TournamentStatus): void {
  db.update(tournaments).set({ status, updatedAt: new Date().toISOString() }).where(eq(tournaments.id, id)).run();
}
