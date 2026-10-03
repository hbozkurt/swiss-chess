import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Game, Player } from './types';

// The underlying @echecs tiebreak packages are FIDE-certified libraries —
// our job is to integrate them correctly (base score, grouping, correct
// Direct Encounter subgroup, final sort/rank), not re-verify their formulas.
// Mocking them gives deterministic control over exactly that integration.
const buchholzCut1 = vi.fn<(id: string) => number>();
const sonnebornBerger = vi.fn<(id: string) => number>();
const numberOfWins = vi.fn<(id: string) => number>();
const gamesPlayedWithBlack = vi.fn<(id: string) => number>();
const directEncounter = vi.fn<(id: string, games: Game[][], players: Player[]) => number>();

vi.mock('@echecs/buchholz/cut1', () => ({ buchholzCut1: (id: string) => buchholzCut1(id) }));
vi.mock('@echecs/sonneborn-berger', () => ({ sonnebornBerger: (id: string) => sonnebornBerger(id) }));
vi.mock('@echecs/number-of-wins', () => ({ numberOfWins: (id: string) => numberOfWins(id) }));
vi.mock('@echecs/number-of-wins/black', () => ({ gamesPlayedWithBlack: (id: string) => gamesPlayedWithBlack(id) }));
vi.mock('@echecs/direct-encounter', () => ({
  directEncounter: (id: string, games: Game[][], players: Player[]) => directEncounter(id, games, players),
}));

const { computeBaseScore, computeStandings } = await import('./tiebreaks');

const players: Player[] = [{ id: 'alice' }, { id: 'bob' }, { id: 'carol' }, { id: 'dave' }];

beforeEach(() => {
  vi.resetAllMocks();
});

describe('computeBaseScore', () => {
  it('sums wins/draws/losses from both the white and black side', () => {
    const games: Game[][] = [
      [{ white: 'alice', black: 'bob', result: 1 }],
      [{ white: 'carol', black: 'alice', result: 0.5 }],
    ];
    expect(computeBaseScore('alice', games)).toBe(1.5); // won as white, drew as black
    expect(computeBaseScore('bob', games)).toBe(0);
    expect(computeBaseScore('carol', games)).toBe(0.5);
  });

  it('credits full-bye points to the bye player without crediting a phantom opponent', () => {
    const games: Game[][] = [[{ white: 'alice', black: '', result: 1, kind: 'full-bye' }]];
    expect(computeBaseScore('alice', games)).toBe(1);
  });
});

describe('computeStandings', () => {
  it('sorts by score first when tiebreaks are irrelevant (no ties)', () => {
    const games: Game[][] = [
      [
        { white: 'alice', black: 'bob', result: 1 }, // alice 1, bob 0
        { white: 'carol', black: 'dave', result: 0.5 }, // carol 0.5, dave 0.5
      ],
      [{ white: 'alice', black: 'carol', result: 0.5 }], // alice 1.5, carol 1
    ];
    buchholzCut1.mockReturnValue(0);
    sonnebornBerger.mockReturnValue(0);
    numberOfWins.mockReturnValue(0);
    gamesPlayedWithBlack.mockReturnValue(0);
    directEncounter.mockReturnValue(0);

    const standings = computeStandings(players, games);
    expect(standings.map((s) => s.playerId)).toEqual(['alice', 'carol', 'dave', 'bob']);
    expect(standings.map((s) => s.rank)).toEqual([1, 2, 3, 4]);
    expect(directEncounter).not.toHaveBeenCalled(); // no two players ever tie on every prior key
  });

  it('only invokes Direct Encounter for groups still tied after score/Buchholz/Sonneborn-Berger, and only against that subgroup', () => {
    // alice & bob both score 1 (via separate games) and are mocked equal on
    // Buchholz/SB, so they group together. carol & dave are mocked with
    // distinct Buchholz values, so each is its own singleton group despite
    // also scoring 0 — Direct Encounter must not be invoked for them.
    const games: Game[][] = [
      [
        { white: 'alice', black: 'carol', result: 1 }, // alice 1, carol 0
        { white: 'bob', black: 'dave', result: 1 }, // bob 1, dave 0
      ],
    ];
    buchholzCut1.mockImplementation((id: string) => (id === 'carol' ? 9 : id === 'dave' ? 1 : 2));
    sonnebornBerger.mockReturnValue(1);
    numberOfWins.mockReturnValue(1);
    gamesPlayedWithBlack.mockReturnValue(1);
    directEncounter.mockReturnValue(0);

    computeStandings(players, games);

    expect(directEncounter).toHaveBeenCalledTimes(2); // once each for alice, bob
    for (const [, , groupPlayers] of directEncounter.mock.calls) {
      expect(groupPlayers.map((p) => p.id).sort()).toEqual(['alice', 'bob']);
    }
    expect(directEncounter).not.toHaveBeenCalledWith('carol', expect.anything(), expect.anything());
    expect(directEncounter).not.toHaveBeenCalledWith('dave', expect.anything(), expect.anything());
  });

  it('ranks the Direct Encounter winner above the tied opponent they beat', () => {
    const games: Game[][] = [
      [
        { white: 'alice', black: 'carol', result: 1 }, // alice 1, carol 0
        { white: 'bob', black: 'dave', result: 1 }, // bob 1, dave 0
      ],
    ];
    buchholzCut1.mockReturnValue(2);
    sonnebornBerger.mockReturnValue(1);
    numberOfWins.mockReturnValue(1);
    gamesPlayedWithBlack.mockReturnValue(1);
    directEncounter.mockImplementation((id: string) => (id === 'alice' ? 1 : 0)); // alice "won" the tiebreak

    const standings = computeStandings(
      players.filter((p) => p.id === 'alice' || p.id === 'bob'),
      games,
    );
    expect(standings[0]!.playerId).toBe('alice');
    expect(standings[0]!.rank).toBe(1);
    expect(standings[1]!.playerId).toBe('bob');
    expect(standings[1]!.rank).toBe(2);
  });

  it('assigns a shared rank to players tied on every criterion', () => {
    buchholzCut1.mockReturnValue(0);
    sonnebornBerger.mockReturnValue(0);
    numberOfWins.mockReturnValue(0);
    gamesPlayedWithBlack.mockReturnValue(0);
    directEncounter.mockReturnValue(0);

    const standings = computeStandings(players, []);
    expect(standings.map((s) => s.rank)).toEqual([1, 1, 1, 1]);
  });
});
