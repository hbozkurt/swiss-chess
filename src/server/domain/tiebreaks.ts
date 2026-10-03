import { buchholzCut1 } from '@echecs/buchholz/cut1';
import { directEncounter } from '@echecs/direct-encounter';
import { gamesPlayedWithBlack } from '@echecs/number-of-wins/black';
import { numberOfWins } from '@echecs/number-of-wins';
import { sonnebornBerger } from '@echecs/sonneborn-berger';
import { isBye } from './types';
import type { Game, Player, RankedStanding } from './types';

/** Sum of a player's game results across all rounds (1 = win, 0.5 = draw, 0 = loss/bye-as-zero). */
export function computeBaseScore(playerId: string, games: Game[][]): number {
  let score = 0;
  for (const round of games) {
    for (const g of round) {
      if (g.white === playerId) score += g.result;
      else if (!isBye(g) && g.black === playerId) score += 1 - g.result;
    }
  }
  return score;
}

interface BaseStanding {
  playerId: string;
  score: number;
  buchholzCut1: number;
  sonnebornBerger: number;
  wins: number;
  blackGames: number;
}

function groupBy<T, K>(items: T[], key: (item: T) => K): T[][] {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const group = groups.get(k);
    if (group) group.push(item);
    else groups.set(k, [item]);
  }
  return [...groups.values()];
}

/**
 * Computes FIDE-ordered standings: score, then Buchholz Cut 1, then
 * Sonneborn-Berger, then Direct Encounter, then Wins, then Black-games.
 *
 * Direct Encounter is only meaningful — and only computed — against the exact
 * subgroup of players still tied after score/Buchholz/Sonneborn-Berger, per
 * `@echecs/direct-encounter`'s contract (passing the full field instead
 * silently defeats it). Groups of 1 get a neutral `0` since there is no
 * comparison to make.
 */
export function computeStandings(players: Player[], games: Game[][]): RankedStanding[] {
  const base: BaseStanding[] = players.map((p) => ({
    playerId: p.id,
    score: computeBaseScore(p.id, games),
    buchholzCut1: buchholzCut1(p.id, games),
    sonnebornBerger: sonnebornBerger(p.id, games),
    wins: numberOfWins(p.id, games),
    blackGames: gamesPlayedWithBlack(p.id, games),
  }));

  const groups = groupBy(base, (r) => `${r.score}|${r.buchholzCut1}|${r.sonnebornBerger}`);

  const withDirectEncounter = groups.flatMap((group) => {
    const groupPlayers = players.filter((p) => group.some((r) => r.playerId === p.id));
    return group.map((r) => ({
      ...r,
      directEncounter: group.length > 1 ? directEncounter(r.playerId, games, groupPlayers) : 0,
    }));
  });

  const sorted = withDirectEncounter.sort(
    (a, b) =>
      b.score - a.score ||
      b.buchholzCut1 - a.buchholzCut1 ||
      b.sonnebornBerger - a.sonnebornBerger ||
      b.directEncounter - a.directEncounter ||
      b.wins - a.wins ||
      b.blackGames - a.blackGames,
  );

  let rank = 0;
  let previous: (typeof sorted)[number] | undefined;
  return sorted.map((r, i) => {
    const tiedWithPrevious =
      previous !== undefined &&
      r.score === previous.score &&
      r.buchholzCut1 === previous.buchholzCut1 &&
      r.sonnebornBerger === previous.sonnebornBerger &&
      r.directEncounter === previous.directEncounter &&
      r.wins === previous.wins &&
      r.blackGames === previous.blackGames;
    if (!tiedWithPrevious) rank = i + 1;
    previous = r;
    return { ...r, rank };
  });
}
