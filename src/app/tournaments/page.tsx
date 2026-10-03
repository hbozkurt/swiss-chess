import Link from 'next/link';
import { CreateTournamentForm } from '@/components/CreateTournamentForm';
import { listTournamentsAction } from '@/server/actions/tournament-actions';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  setup: 'Setup',
  in_progress: 'In progress',
  completed: 'Completed',
};

export default async function TournamentsPage() {
  const tournaments = await listTournamentsAction();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Tournaments</h1>
      <p className="mt-1 text-sm text-zinc-600">Create and manage Swiss-system chess tournaments.</p>

      <div className="mt-6">
        <CreateTournamentForm />
      </div>

      <div className="mt-8">
        {tournaments.length === 0 ? (
          <p className="text-sm text-zinc-500">No tournaments yet — create one above.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
            {tournaments.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/tournaments/${t.id}/players`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50"
                >
                  <div>
                    <p className="font-medium text-zinc-900">{t.name}</p>
                    <p className="text-xs text-zinc-500">{t.totalRounds} rounds</p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                    {STATUS_LABEL[t.status] ?? t.status}
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
