'use client';

import { useLocale } from '@/hooks/useLocale';

export function CascadeConfirmDialog({
  affectedRoundNumbers,
  affectedGameCount,
  onConfirm,
  onCancel,
  isPending,
}: {
  affectedRoundNumbers: number[];
  affectedGameCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const t = useLocale();
  const isPlural = affectedRoundNumbers.length > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
        <h2 className="text-base font-semibold text-zinc-900">{t('cascade.title')}</h2>
        <p className="mt-2 text-sm text-zinc-600">
          {isPlural ? t('cascade.roundsPrefixPlural') : t('cascade.roundsPrefixSingular')}{' '}
          <span className="font-medium text-zinc-900">{affectedRoundNumbers.join(', ')}</span>{' '}
          {isPlural
            ? t('cascade.bodyAfterRoundsPlural', { count: affectedGameCount })
            : t('cascade.bodyAfterRoundsSingular', { count: affectedGameCount })}
        </p>
        <p className="mt-2 text-sm font-medium text-amber-700">{t('cascade.warning')}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            {t('cascade.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? t('cascade.confirmPending') : t('cascade.confirmIdle')}
          </button>
        </div>
      </div>
    </div>
  );
}
