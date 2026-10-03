'use server';

import { revalidatePath } from 'next/cache';
import { db } from '../db/client';
import type { GameKind } from '../domain/types';
import type { RequestedBye } from '../domain/tournament-engine';
import * as gameRepo from '../repositories/game-repo';
import * as playerRepo from '../repositories/player-repo';
import * as roundRepo from '../repositories/round-repo';
import { generateNextRound, getStandings, updateGameResult } from '../services/tournament-service';

export interface GameView {
  id: string;
  boardNumber: number;
  white: { id: string; name: string; rating: number | null };
  black: { id: string; name: string; rating: number | null } | null;
  result: number | null;
  kind: GameKind | null;
}

function toNameMap(tournamentId: string) {
  return new Map(playerRepo.listPlayers(db, tournamentId).map((p) => [p.id, p]));
}

export async function generateNextRoundAction(tournamentId: string, requestedByes: RequestedBye[] = []) {
  const result = await generateNextRound(db, tournamentId, requestedByes);
  revalidatePath(`/tournaments/${tournamentId}`);
  return result;
}

export async function getLiveRoundsAction(tournamentId: string) {
  return roundRepo.findLiveRounds(db, tournamentId);
}

export async function getRoundGamesAction(tournamentId: string, roundNumber: number): Promise<GameView[]> {
  const round = roundRepo.findLiveRounds(db, tournamentId).find((r) => r.roundNumber === roundNumber);
  if (!round) return [];
  const names = toNameMap(tournamentId);
  const games = gameRepo.getGamesByRound(db, round.id);
  return games.map((g) => {
    const white = names.get(g.whitePlayerId);
    const black = g.blackPlayerId ? names.get(g.blackPlayerId) : undefined;
    return {
      id: g.id,
      boardNumber: g.boardNumber,
      white: { id: g.whitePlayerId, name: white?.name ?? g.whitePlayerId, rating: white?.rating ?? null },
      black: black ? { id: black.id, name: black.name, rating: black.rating } : null,
      result: g.result,
      kind: g.kind,
    };
  });
}

export async function updateGameResultAction(
  tournamentId: string,
  gameId: string,
  update: { result: number | null; kind: GameKind | null },
  options: { confirmed?: boolean; note?: string } = {},
) {
  const outcome = await updateGameResult(db, gameId, update, options);
  if (outcome.status === 'applied') {
    revalidatePath(`/tournaments/${tournamentId}`);
  }
  return outcome;
}

export interface StandingView {
  rank: number;
  playerId: string;
  name: string;
  rating: number | null;
  score: number;
  buchholzCut1: number;
  sonnebornBerger: number;
  directEncounter: number;
  wins: number;
  blackGames: number;
}

export async function getStandingsAction(tournamentId: string): Promise<StandingView[]> {
  const names = toNameMap(tournamentId);
  const standings = await getStandings(db, tournamentId);
  return standings.map((s) => {
    const player = names.get(s.playerId);
    return {
      rank: s.rank,
      playerId: s.playerId,
      name: player?.name ?? s.playerId,
      rating: player?.rating ?? null,
      score: s.score,
      buchholzCut1: s.buchholzCut1,
      sonnebornBerger: s.sonnebornBerger,
      directEncounter: s.directEncounter,
      wins: s.wins,
      blackGames: s.blackGames,
    };
  });
}
