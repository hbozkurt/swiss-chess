import type { Game, GameKind, Pairing, PairingResult, Player, Result } from '@echecs/swiss';

export type { Game, GameKind, Pairing, PairingResult, Player, Result };

/** A player's score, tiebreak values, and rank for the standings table. */
export interface RankedStanding {
  playerId: string;
  score: number;
  buchholzCut1: number;
  sonnebornBerger: number;
  directEncounter: number;
  wins: number;
  blackGames: number;
  rank: number;
}

export const BYE_OPPONENT_ID = '';

export function isBye(game: Game): boolean {
  return game.black === BYE_OPPONENT_ID;
}
