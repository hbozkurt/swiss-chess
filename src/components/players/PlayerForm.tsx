'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { parseBulkPlayers } from '@/lib/parse-players';
import { addPlayersAction } from '@/server/actions/player-actions';

export function PlayerForm({ tournamentId }: { tournamentId: string }) {
  const t = useLocale();
  const router = useRouter();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const parsed = parseBulkPlayers(text);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (parsed.length === 0) {
      setError(t('players.form.validationError'));
      return;
    }
    startTransition(async () => {
      try {
        await addPlayersAction(tournamentId, parsed);
        setText('');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errors.addPlayersFailed'));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-200 bg-white p-4">
      <label className="text-xs font-medium text-zinc-600" htmlFor="bulk-players">
        {t('players.form.labelPrefix')}
        <code className="font-mono">{t('players.form.labelExampleName')}</code>
        {t('players.form.labelOr')}
        <code className="font-mono">{t('players.form.labelExampleNameRating')}</code>
      </label>
      <textarea
        id="bulk-players"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder={t('players.form.placeholder')}
        className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm focus:border-zinc-500 focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-zinc-500">{t('players.form.counter', { count: parsed.length })}</p>
        <button
          type="submit"
          disabled={isPending || parsed.length === 0}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {isPending ? t('players.form.submitPending') : t('players.form.submitIdle')}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
