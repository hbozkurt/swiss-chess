'use client';

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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
        <h2 className="text-base font-semibold text-zinc-900">Editing an earlier round</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Round{affectedRoundNumbers.length > 1 ? 's' : ''}{' '}
          <span className="font-medium text-zinc-900">{affectedRoundNumbers.join(', ')}</span>{' '}
          {affectedRoundNumbers.length > 1 ? 'were' : 'was'} already paired from this result ({affectedGameCount}{' '}
          game{affectedGameCount === 1 ? '' : 's'}). Changing this result will invalidate{' '}
          {affectedRoundNumbers.length > 1 ? 'those rounds' : 'that round'} — you will need to re-generate{' '}
          {affectedRoundNumbers.length > 1 ? 'them' : 'it'} afterward.
        </p>
        <p className="mt-2 text-sm font-medium text-amber-700">This cannot be undone except by re-entering results.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? 'Applying…' : 'Invalidate & continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
