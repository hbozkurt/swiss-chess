import type { StandingView } from '@/server/actions/round-actions';

export function StandingsTable({ standings }: { standings: StandingView[] }) {
  if (standings.length === 0) {
    return <p className="text-sm text-zinc-500">No standings yet — register players and play a round.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] overflow-hidden rounded-lg border border-zinc-200 bg-white text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium text-zinc-600">
            <th className="px-3 py-2 w-10">#</th>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2 text-center">Rtg</th>
            <th className="px-3 py-2 text-center">Pts</th>
            <th className="px-3 py-2 text-center" title="Buchholz Cut 1">
              Bu-1
            </th>
            <th className="px-3 py-2 text-center" title="Sonneborn-Berger">
              SB
            </th>
            <th className="px-3 py-2 text-center" title="Direct Encounter">
              DE
            </th>
            <th className="px-3 py-2 text-center" title="Number of wins">
              Wins
            </th>
            <th className="px-3 py-2 text-center" title="Games played with Black">
              Blk
            </th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s) => (
            <tr key={s.playerId} className="border-b border-zinc-100 last:border-0">
              <td className="px-3 py-2 text-zinc-500">{s.rank}</td>
              <td className="px-3 py-2 font-medium text-zinc-900">{s.name}</td>
              <td className="px-3 py-2 text-center text-zinc-600">{s.rating ?? '—'}</td>
              <td className="px-3 py-2 text-center font-semibold text-zinc-900">{s.score}</td>
              <td className="px-3 py-2 text-center text-zinc-600">{s.buchholzCut1}</td>
              <td className="px-3 py-2 text-center text-zinc-600">{s.sonnebornBerger}</td>
              <td className="px-3 py-2 text-center text-zinc-600">{s.directEncounter}</td>
              <td className="px-3 py-2 text-center text-zinc-600">{s.wins}</td>
              <td className="px-3 py-2 text-center text-zinc-600">{s.blackGames}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
