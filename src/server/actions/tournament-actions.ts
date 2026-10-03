'use server';

import { revalidatePath } from 'next/cache';
import { db } from '../db/client';
import * as tournamentRepo from '../repositories/tournament-repo';

export async function createTournamentAction(input: { name: string; totalRounds: number }) {
  if (input.name.trim().length === 0) throw new Error('Tournament name is required');
  if (!Number.isInteger(input.totalRounds) || input.totalRounds < 1) {
    throw new Error('Total rounds must be a positive integer');
  }
  const tournament = tournamentRepo.createTournament(db, input);
  revalidatePath('/tournaments');
  return tournament;
}

export async function listTournamentsAction() {
  return tournamentRepo.listTournaments(db);
}

export async function getTournamentAction(id: string) {
  return tournamentRepo.getTournament(db, id);
}
