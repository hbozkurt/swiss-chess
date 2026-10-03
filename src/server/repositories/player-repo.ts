import { and, eq, isNull } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import type { DbOrTx } from '../db/client';
import { players } from '../db/schema';

export interface PlayerRow {
  id: string;
  tournamentId: string;
  name: string;
  rating: number | null;
  withdrawnAt: string | null;
  createdAt: string;
}

export function addPlayers(db: DbOrTx, tournamentId: string, input: { name: string; rating?: number | null }[]): PlayerRow[] {
  if (input.length === 0) return [];
  return db
    .insert(players)
    .values(input.map((p) => ({ id: uuid(), tournamentId, name: p.name, rating: p.rating ?? null })))
    .returning()
    .all() as PlayerRow[];
}

export function listPlayers(db: DbOrTx, tournamentId: string): PlayerRow[] {
  return db.select().from(players).where(eq(players.tournamentId, tournamentId)).all() as PlayerRow[];
}

export function listActivePlayers(db: DbOrTx, tournamentId: string): PlayerRow[] {
  return db
    .select()
    .from(players)
    .where(and(eq(players.tournamentId, tournamentId), isNull(players.withdrawnAt)))
    .all() as PlayerRow[];
}

export function withdrawPlayer(db: DbOrTx, playerId: string): void {
  db.update(players).set({ withdrawnAt: new Date().toISOString() }).where(eq(players.id, playerId)).run();
}
