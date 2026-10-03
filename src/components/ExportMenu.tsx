export function ExportMenu({ tournamentId }: { tournamentId: string }) {
  const base = `/api/tournaments/${tournamentId}/export`;
  const links = [
    { href: `${base}/players.csv`, label: 'Players (CSV)' },
    { href: `${base}/results.csv`, label: 'Results (CSV)' },
    { href: `${base}/standings.csv`, label: 'Standings (CSV)' },
    { href: `${base}/standings.pdf`, label: 'Standings (PDF)' },
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
