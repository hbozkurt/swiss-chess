import { pair } from '@echecs/swiss';
import type { Game, GameKind, Pairing, Player } from './types';

export interface RequestedBye {
  playerId: string;
  /** Points awarded for a voluntarily-requested bye. Defaults to half-point per FIDE 16.13. */
  kind: Extract<GameKind, 'half-bye' | 'zero-bye'>;
}

export interface RoundPlan {
  pairings: Pairing[];
  /** Pairing-forced byes (odd player count after excluding requested byes), always full-point. */
  forcedByes: { player: string }[];
  /** Voluntary byes the arbiter assigned for this round, excluded from pairing. */
  requestedByes: RequestedBye[];
}

const KIND_RESULT: Record<GameKind, Game['result']> = {
  'forfeit-loss': 0,
  'forfeit-win': 1,
  'full-bye': 1,
  'half-bye': 0.5,
  'pairing-bye': 1,
  'zero-bye': 0,
};

/** The numeric result that corresponds to a `GameKind`, per FIDE C.07 Art. 16.2. */
export function resultForKind(kind: GameKind): Game['result'] {
  return KIND_RESULT[kind];
}

/**
 * Generates the next round's pairings. Players with a requested bye are
 * excluded from `pair()` entirely (so pairing/color/rematch logic never sees
 * them for this round) and recorded separately as voluntary byes.
 *
 * @throws {RangeError} propagated from `pair()` if fewer than 2 players remain
 *   after excluding requested byes, or if `games` references an unknown player id.
 */
export function planNextRound(players: Player[], games: Game[][], requestedByes: RequestedBye[] = []): RoundPlan {
  const requestedIds = new Set(requestedByes.map((b) => b.playerId));
  const pairablePlayers = players.filter((p) => !requestedIds.has(p.id));

  const { pairings, byes } = pair(pairablePlayers, games);

  return { pairings, forcedByes: byes, requestedByes };
}
