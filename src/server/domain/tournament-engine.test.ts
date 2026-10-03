import { describe, expect, it } from 'vitest';
import { planNextRound, resultForKind } from './tournament-engine';
import type { Game, Player } from './types';

function makePlayers(n: number): Player[] {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i}`, rating: 1000 + i * 10 }));
}

/** Appends one simulated round's games (all pairings decided by `white wins`) to the history, in-place style (returns new array). */
function simulateRound(
  games: Game[][],
  plan: ReturnType<typeof planNextRound>,
  resultForPairing: (white: string, black: string) => Game['result'] = () => 1,
): Game[][] {
  const roundGames: Game[] = plan.pairings.map((p) => ({
    white: p.white,
    black: p.black,
    result: resultForPairing(p.white, p.black),
  }));
  for (const bye of plan.forcedByes) {
    roundGames.push({ white: bye.player, black: '', result: resultForKind('full-bye'), kind: 'full-bye' });
  }
  for (const bye of plan.requestedByes) {
    roundGames.push({ white: bye.playerId, black: '', result: resultForKind(bye.kind), kind: bye.kind });
  }
  return [...games, roundGames];
}

describe('resultForKind', () => {
  it('maps every GameKind to its FIDE C.07 Art. 16.2 result', () => {
    expect(resultForKind('forfeit-win')).toBe(1);
    expect(resultForKind('forfeit-loss')).toBe(0);
    expect(resultForKind('full-bye')).toBe(1);
    expect(resultForKind('half-bye')).toBe(0.5);
    expect(resultForKind('pairing-bye')).toBe(1);
    expect(resultForKind('zero-bye')).toBe(0);
  });
});

describe('planNextRound', () => {
  it('gives exactly one forced bye for an odd player count and none for even', () => {
    const odd = planNextRound(makePlayers(5), []);
    expect(odd.forcedByes).toHaveLength(1);
    expect(odd.pairings).toHaveLength(2);

    const even = planNextRound(makePlayers(6), []);
    expect(even.forcedByes).toHaveLength(0);
    expect(even.pairings).toHaveLength(3);
  });

  it('never gives the same player a forced bye twice across many rounds', () => {
    const players = makePlayers(7);
    let games: Game[][] = [];
    const byeRecipients: string[] = [];

    for (let round = 0; round < 6; round++) {
      const plan = planNextRound(players, games);
      byeRecipients.push(...plan.forcedByes.map((b) => b.player));
      games = simulateRound(games, plan);
    }

    const counts = new Map<string, number>();
    for (const id of byeRecipients) counts.set(id, (counts.get(id) ?? 0) + 1);
    for (const count of counts.values()) expect(count).toBeLessThanOrEqual(1);
  });

  it('never repeats a pairing across rounds for a stable field with no byes', () => {
    const players = makePlayers(8);
    let games: Game[][] = [];
    const seenPairs = new Set<string>();

    for (let round = 0; round < 5; round++) {
      const plan = planNextRound(players, games);
      for (const p of plan.pairings) {
        const key = [p.white, p.black].sort().join('-');
        expect(seenPairs.has(key)).toBe(false);
        seenPairs.add(key);
      }
      games = simulateRound(games, plan);
    }
  });

  it('excludes requested-bye players from pairing and records them separately', () => {
    const players = makePlayers(6);
    const plan = planNextRound(players, [], [{ playerId: 'p0', kind: 'half-bye' }]);

    expect(plan.requestedByes).toEqual([{ playerId: 'p0', kind: 'half-bye' }]);
    expect(plan.pairings.every((p) => p.white !== 'p0' && p.black !== 'p0')).toBe(true);
    expect(plan.forcedByes.every((b) => b.player !== 'p0')).toBe(true);
    // 5 remaining players -> one forced bye among them
    expect(plan.forcedByes).toHaveLength(1);
  });
});
