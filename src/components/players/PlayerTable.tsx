'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { withdrawPlayerAction } from '@/server/actions/player-actions';
import type { PlayerRow } from '@/server/repositories/player-repo';

export function PlayerTable({ tournamentId, players, locked }: { tournamentId: string; players: PlayerRow[]; locked: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleWithdraw(playerId: string) {
    startTransition(async () => {
      await withdrawPlayerAction(tournamentId, playerId);
      router.refresh();
    });
  }

  if (players.length === 0) {
    return <p className="mt-4 text-sm text-zinc-500">No players registered yet.</p>;
  }

  return (
    <table className="mt-4 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white text-sm">
      <thead>
        <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium text-zinc-600">
          <th className="px-4 py-2">Name</th>
          <th className="px-4 py-2">Rating</th>
          <th className="px-4 py-2">Status</th>
          <th className="px-4 py-2" />
        </tr>
      </thead>
      <tbody>
        {players.map((p) => (
          <tr key={p.id} className="border-b border-zinc-100 last:border-0">
            <td className="px-4 py-2 font-medium text-zinc-900">{p.name}</td>
            <td className="px-4 py-2 text-zinc-600">{p.rating ?? '—'}</td>
            <td className="px-4 py-2">
              {p.withdrawnAt ? (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">Withdrawn</span>
              ) : (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">Active</span>
              )}
            </td>
            <td className="px-4 py-2 text-right">
              {!p.withdrawnAt && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleWithdraw(p.id)}
                  className="text-xs text-zinc-500 hover:text-red-600 disabled:opacity-50"
                >
                  Withdraw
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
      {locked && (
        <tfoot>
          <tr>
            <td colSpan={4} className="px-4 py-2 text-xs text-amber-700 bg-amber-50">
              Round 1 has been paired — new players can no longer be added. Existing players can still be withdrawn.
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}
