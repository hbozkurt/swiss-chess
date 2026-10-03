'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { generateNextRoundAction } from '@/server/actions/round-actions';

export function GenerateRoundButton({ tournamentId }: { tournamentId: string }) {
  const t = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await generateNextRoundAction(tournamentId);
        router.push(`/tournaments/${tournamentId}/rounds/${result.roundNumber}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errors.generateRoundFailed'));
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {isPending ? t('rounds.generatePending') : t('rounds.generateIdle')}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
