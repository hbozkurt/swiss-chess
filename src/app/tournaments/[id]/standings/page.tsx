import { ExportMenu } from '@/components/ExportMenu';
import { StandingsTable } from '@/components/standings/StandingsTable';
import { getStandingsAction } from '@/server/actions/round-actions';

export const dynamic = 'force-dynamic';

export default async function StandingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const standings = await getStandingsAction(id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-600">Final standings, FIDE tiebreak order</h2>
        <ExportMenu tournamentId={id} />
      </div>
      <StandingsTable standings={standings} />
    </div>
  );
}
