'use client';

import type { GameView } from '@/server/actions/round-actions';

const RESULT_OPTIONS: { label: string; result: number }[] = [
  { label: '1 – 0', result: 1 },
  { label: '½ – ½', result: 0.5 },
  { label: '0 – 1', result: 0 },
];

export function ResultEntryRow({
  game,
  onSelectResult,
  disabled,
}: {
  game: GameView;
  onSelectResult: (gameId: string, result: number) => void;
  disabled: boolean;
}) {
  if (game.black === null) {
    const label = game.kind === 'half-bye' ? 'Half-point bye' : game.kind === 'zero-bye' ? 'Bye (no points)' : 'Bye';
    return (
      <tr className="border-b border-zinc-100 last:border-0">
        <td className="px-4 py-2 text-zinc-500">{game.boardNumber}</td>
        <td className="px-4 py-2 font-medium text-zinc-900">{game.white.name}</td>
        <td className="px-4 py-2 text-center text-zinc-500">—</td>
        <td className="px-4 py-2 text-zinc-400 italic">{label}</td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-zinc-100 last:border-0">
      <td className="px-4 py-2 text-zinc-500">{game.boardNumber}</td>
      <td className="px-4 py-2 font-medium text-zinc-900">
        {game.white.name}
        {game.white.rating !== null && <span className="ml-1 text-xs text-zinc-400">({game.white.rating})</span>}
      </td>
      <td className="px-4 py-2 text-center">
        <div className="inline-flex gap-1">
          {RESULT_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              disabled={disabled}
              onClick={() => onSelectResult(game.id, opt.result)}
              className={`rounded px-2 py-1 text-xs font-medium disabled:opacity-50 ${
                game.result === opt.result ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </td>
      <td className="px-4 py-2 font-medium text-zinc-900">
        {game.black.name}
        {game.black.rating !== null && <span className="ml-1 text-xs text-zinc-400">({game.black.rating})</span>}
      </td>
    </tr>
  );
}
