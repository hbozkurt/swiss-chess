import { asc, eq, inArray } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import type { GameKind } from '../domain/types';
import type { DbOrTx } from '../db/client';
import { games, resultEditAudit } from '../db/schema';

export interface GameRow {
  id: string;
  roundId: string;
  tournamentId: string;
  boardNumber: number;
  whitePlayerId: string;
  blackPlayerId: string | null;
  result: number | null;
  kind: GameKind | null;
  enteredAt: string | null;
  editedAt: string | null;
}

export interface NewGame {
  boardNumber: number;
  whitePlayerId: string;
  blackPlayerId: string | null;
  result: number | null;
  kind: GameKind | null;
}

export function insertGamesForRound(
  db: DbOrTx,
  input: { roundId: string; tournamentId: string; games: NewGame[] },
): GameRow[] {
  if (input.games.length === 0) return [];
  return db
    .insert(games)
    .values(
      input.games.map((g) => ({
        id: uuid(),
        roundId: input.roundId,
        tournamentId: input.tournamentId,
        boardNumber: g.boardNumber,
        whitePlayerId: g.whitePlayerId,
        blackPlayerId: g.blackPlayerId,
        result: g.result,
        kind: g.kind,
        enteredAt: g.result !== null ? new Date().toISOString() : null,
      })),
    )
    .returning()
    .all() as GameRow[];
}

export function getGamesByRound(db: DbOrTx, roundId: string): GameRow[] {
  return db.select().from(games).where(eq(games.roundId, roundId)).orderBy(asc(games.boardNumber)).all() as GameRow[];
}

export function getGamesByRounds(db: DbOrTx, roundIds: string[]): GameRow[] {
  if (roundIds.length === 0) return [];
  return db.select().from(games).where(inArray(games.roundId, roundIds)).all() as GameRow[];
}

export function countGamesForRounds(db: DbOrTx, roundIds: string[]): number {
  return getGamesByRounds(db, roundIds).length;
}

export function findGameById(db: DbOrTx, gameId: string): GameRow | undefined {
  return db.select().from(games).where(eq(games.id, gameId)).all()[0] as GameRow | undefined;
}

/** Updates a game's result and appends a `result_edit_audit` row recording the prior value. */
export function auditedUpdateResult(db: DbOrTx, gameId: string, update: { result: number | null; kind: GameKind | null }): void {
  const existing = findGameById(db, gameId);
  if (!existing) throw new Error(`game not found: ${gameId}`);

  db.update(games)
    .set({ result: update.result, kind: update.kind, editedAt: new Date().toISOString() })
    .where(eq(games.id, gameId))
    .run();

  db.insert(resultEditAudit)
    .values({
      id: uuid(),
      gameId,
      oldResult: existing.result,
      newResult: update.result,
      oldKind: existing.kind,
      newKind: update.kind,
    })
    .run();
}
