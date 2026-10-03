import { BYE_OPPONENT_ID } from './types';
import type { Game, GameKind, Player } from './types';

/** Minimal shape the repository layer must provide for a registered player. */
export interface PlayerRecord {
  id: string;
  rating: number | null;
  withdrawnAt: string | null;
}

/** Minimal shape the repository layer must provide for one recorded game. */
export interface GameRecord {
  whitePlayerId: string;
  blackPlayerId: string | null;
  result: number | null;
  kind: GameKind | null;
}

export function toEchecsPlayer(p: PlayerRecord): Player {
  return { id: p.id, ...(p.rating !== null && { rating: p.rating }) };
}

/**
 * Maps registered players to the `@echecs` `Player[]` shape, excluding
 * withdrawn players — they must not be pairable in future rounds, but their
 * history is still available to the games array for scoring/tiebreaks.
 */
export function toEchecsPlayers(players: PlayerRecord[]): Player[] {
  return players.filter((p) => p.withdrawnAt === null).map(toEchecsPlayer);
}

/**
 * Maps a tournament's live rounds (already filtered to non-invalidated, in
 * round-number order) to the `@echecs` `Game[][]` shape. Byes become a `Game`
 * with `black: ''`, per the convention `pair()` reads to avoid a repeat bye.
 * Unplayed games (`result: null`) are omitted — `pair()` is only ever called
 * for a round once every game in prior rounds has a recorded result.
 */
export function toEchecsGames(liveRounds: GameRecord[][]): Game[][] {
  return liveRounds.map((round) =>
    round
      .filter((g) => g.result !== null)
      .map((g) => ({
        white: g.whitePlayerId,
        black: g.blackPlayerId ?? BYE_OPPONENT_ID,
        result: g.result as Game['result'],
        ...(g.kind !== null && { kind: g.kind }),
      })),
  );
}
