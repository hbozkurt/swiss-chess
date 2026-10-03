'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useLocale } from '@/hooks/useLocale';
import type { GameView } from '@/server/actions/round-actions';
import { updateGameResultAction } from '@/server/actions/round-actions';
import { CascadeConfirmDialog } from './CascadeConfirmDialog';
import { ResultEntryRow } from './ResultEntryRow';

export function PairingTable({ tournamentId, games }: { tournamentId: string; games: GameView[] }) {
  const t = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    gameId: string;
    result: number;
    affectedRoundNumbers: number[];
    affectedGameCount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function applyResult(gameId: string, result: number, confirmed = false) {
    startTransition(async () => {
      setError(null);
      try {
        const outcome = await updateGameResultAction(
          tournamentId,
          gameId,
          { result, kind: null },
          { confirmed },
        );
        if (outcome.status === 'confirmation_required') {
          setPendingConfirmation({
            gameId,
            result,
            affectedRoundNumbers: outcome.preview.affectedRoundNumbers,
            affectedGameCount: outcome.preview.affectedGameCount,
          });
          return;
        }
        setPendingConfirmation(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errors.updateResultFailed'));
      }
    });
  }

  const playableGames = games.filter((g) => g.black !== null);
  const byeGames = games.filter((g) => g.black === null);

  return (
    <div>
      <table className="w-full overflow-hidden rounded-lg border border-zinc-200 bg-white text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium text-zinc-600">
            <th className="px-4 py-2 w-14">{t('rounds.table.board')}</th>
            <th className="px-4 py-2">{t('rounds.table.white')}</th>
            <th className="px-4 py-2 text-center w-40">{t('rounds.table.result')}</th>
            <th className="px-4 py-2">{t('rounds.table.black')}</th>
          </tr>
        </thead>
        <tbody>
          {[...playableGames, ...byeGames].map((g) => (
            <ResultEntryRow key={g.id} game={g} onSelectResult={applyResult} disabled={isPending} />
          ))}
        </tbody>
      </table>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {pendingConfirmation && (
        <CascadeConfirmDialog
          affectedRoundNumbers={pendingConfirmation.affectedRoundNumbers}
          affectedGameCount={pendingConfirmation.affectedGameCount}
          isPending={isPending}
          onCancel={() => setPendingConfirmation(null)}
          onConfirm={() => applyResult(pendingConfirmation.gameId, pendingConfirmation.result, true)}
        />
      )}
    </div>
  );
}
