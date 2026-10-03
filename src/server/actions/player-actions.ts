'use server';

import { revalidatePath } from 'next/cache';
import { db } from '../db/client';
import * as playerRepo from '../repositories/player-repo';

export async function addPlayersAction(tournamentId: string, players: { name: string; rating?: number }[]) {
  const valid = players.filter((p) => p.name.trim().length > 0);
  const rows = playerRepo.addPlayers(
    db,
    tournamentId,
    valid.map((p) => ({ name: p.name.trim(), rating: p.rating ?? null })),
  );
  revalidatePath(`/tournaments/${tournamentId}/players`);
  return rows;
}

export async function listPlayersAction(tournamentId: string) {
  return playerRepo.listPlayers(db, tournamentId);
}

export async function withdrawPlayerAction(tournamentId: string, playerId: string) {
  playerRepo.withdrawPlayer(db, playerId);
  revalidatePath(`/tournaments/${tournamentId}/players`);
}
