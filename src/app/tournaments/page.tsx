import Link from 'next/link';
import { CreateTournamentForm } from '@/components/CreateTournamentForm';
import { t } from '@/lib/i18n';
import { listTournamentsAction } from '@/server/actions/tournament-actions';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  setup: t('tournaments.status.setup'),
  in_progress: t('tournaments.status.inProgress'),
  completed: t('tournaments.status.completed'),
};

export default async function TournamentsPage() {
  const tournaments = await listTournamentsAction();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">{t('tournaments.title')}</h1>
      <p className="mt-1 text-sm text-zinc-600">{t('tournaments.subtitle')}</p>

      <div className="mt-6">
        <CreateTournamentForm />
      </div>

      <div className="mt-8">
        {tournaments.length === 0 ? (
          <p className="text-sm text-zinc-500">{t('tournaments.emptyState')}</p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
            {tournaments.map((tournament) => (
              <li key={tournament.id}>
                <Link
                  href={`/tournaments/${tournament.id}/players`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50"
                >
                  <div>
                    <p className="font-medium text-zinc-900">{tournament.name}</p>
                    <p className="text-xs text-zinc-500">{t('tournaments.roundsCount', { count: tournament.totalRounds })}</p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                    {STATUS_LABEL[tournament.status] ?? tournament.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
