import { describe, expect, it } from 'vitest';
import { toEchecsGames, toEchecsPlayers } from './pairing-adapter';

describe('toEchecsPlayers', () => {
  it('excludes withdrawn players and omits rating when null', () => {
    const result = toEchecsPlayers([
      { id: 'alice', rating: 2000, withdrawnAt: null },
      { id: 'bob', rating: null, withdrawnAt: null },
      { id: 'carol', rating: 1800, withdrawnAt: '2026-01-01T00:00:00.000Z' },
    ]);
    expect(result).toEqual([
      { id: 'alice', rating: 2000 },
      { id: 'bob' },
    ]);
  });
});

describe('toEchecsGames', () => {
  it('maps rounds in order, converts null black to a bye marker, and drops unplayed games', () => {
    const result = toEchecsGames([
      [
        { whitePlayerId: 'alice', blackPlayerId: 'bob', result: 1, kind: null },
        { whitePlayerId: 'carol', blackPlayerId: null, result: 1, kind: 'full-bye' },
      ],
      [{ whitePlayerId: 'alice', blackPlayerId: 'carol', result: null, kind: null }],
    ]);
    expect(result).toEqual([
      [
        { white: 'alice', black: 'bob', result: 1 },
        { white: 'carol', black: '', result: 1, kind: 'full-bye' },
      ],
      [],
    ]);
  });
});
