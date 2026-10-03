import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTournamentAction } from '@/server/actions/tournament-actions';
import { getLiveRoundsAction } from '@/server/actions/round-actions';

export const dynamic = 'force-dynamic';

export default async function TournamentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await getTournamentAction(id);
  if (!tournament) notFound();

  const liveRounds = await getLiveRoundsAction(id);
  const currentRound = liveRounds.length > 0 ? liveRounds[liveRounds.length - 1]!.roundNumber : 1;

  const tabs = [
    { href: `/tournaments/${id}/players`, label: 'Players' },
    { href: `/tournaments/${id}/rounds/${currentRound}`, label: 'Rounds' },
    { href: `/tournaments/${id}/standings`, label: 'Standings' },
  ];

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="mb-6">
        <Link href="/tournaments" className="text-xs text-zinc-500 hover:underline">
          ← All tournaments
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{tournament.name}</h1>
        <p className="text-sm text-zinc-600">
          {tournament.totalRounds} rounds · round {liveRounds.length} of {tournament.totalRounds} generated
        </p>
      </div>
      <nav className="mb-6 flex gap-1 border-b border-zinc-200">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            className="px-3 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 border-b-2 border-transparent hover:border-zinc-300"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </main>
  );
}
