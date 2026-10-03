import { t } from '@/lib/i18n';

export function ExportMenu({ tournamentId }: { tournamentId: string }) {
  const base = `/api/tournaments/${tournamentId}/export`;
  const links = [
    { href: `${base}/players.csv`, label: t('exports.playersCsv') },
    { href: `${base}/results.csv`, label: t('exports.resultsCsv') },
    { href: `${base}/standings.csv`, label: t('exports.standingsCsv') },
    { href: `${base}/standings.pdf`, label: t('exports.standingsPdf') },
  ];
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {links.map((l) => (
        <a key={l.href} href={l.href} className="text-zinc-500 hover:underline">
          {l.label}
        </a>
      ))}
    </div>
  );
}
