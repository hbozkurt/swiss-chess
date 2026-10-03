import { t } from '@/lib/i18n';
import type { StandingView } from '@/server/actions/round-actions';

export function StandingsTable({ standings }: { standings: StandingView[] }) {
  if (standings.length === 0) {
    return <p className="text-sm text-zinc-500">{t('standings.emptyState')}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] overflow-hidden rounded-lg border border-zinc-200 bg-white text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium text-zinc-600">
            <th className="px-3 py-2 w-10">{t('standings.table.rank')}</th>
            <th className="px-3 py-2">{t('standings.table.name')}</th>
            <th className="px-3 py-2 text-center">{t('standings.table.rating')}</th>
            <th className="px-3 py-2 text-center">{t('standings.table.points')}</th>
            <th className="px-3 py-2 text-center" title={t('standings.table.buchholzTooltip')}>
              {t('standings.table.buchholz')}
            </th>
            <th className="px-3 py-2 text-center" title={t('standings.table.sonnebornBergerTooltip')}>
              {t('standings.table.sonnebornBerger')}
            </th>
            <th className="px-3 py-2 text-center" title={t('standings.table.directEncounterTooltip')}>
              {t('standings.table.directEncounter')}
            </th>
            <th className="px-3 py-2 text-center" title={t('standings.table.winsTooltip')}>
              {t('standings.table.wins')}
            </th>
            <th className="px-3 py-2 text-center" title={t('standings.table.blackGamesTooltip')}>
              {t('standings.table.blackGames')}
            </th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s) => (
            <tr key={s.playerId} className="border-b border-zinc-100 last:border-0">
              <td className="px-3 py-2 text-zinc-500">{s.rank}</td>
              <td className="px-3 py-2 font-medium text-zinc-900">{s.name}</td>
              <td className="px-3 py-2 text-center text-zinc-600">{s.rating ?? t('common.dash')}</td>
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
