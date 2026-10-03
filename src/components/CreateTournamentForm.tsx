'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createTournamentAction } from '@/server/actions/tournament-actions';

export function CreateTournamentForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [totalRounds, setTotalRounds] = useState(7);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const tournament = await createTournamentAction({ name, totalRounds });
        router.push(`/tournaments/${tournament.id}/players`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create tournament');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-600" htmlFor="name">
          Tournament name
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Spring Open 2026"
          className="w-64 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-600" htmlFor="rounds">
          Total rounds
        </label>
        <input
          id="rounds"
          type="number"
          min={1}
          max={30}
          value={totalRounds}
          onChange={(e) => setTotalRounds(Number.parseInt(e.target.value, 10) || 1)}
          className="w-24 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          required
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {isPending ? 'Creating…' : 'Create tournament'}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
