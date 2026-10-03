import { PlayerForm } from '@/components/players/PlayerForm';
import { PlayerTable } from '@/components/players/PlayerTable';
import { getLiveRoundsAction } from '@/server/actions/round-actions';
import { listPlayersAction } from '@/server/actions/player-actions';

export const dynamic = 'force-dynamic';

export default async function PlayersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [players, liveRounds] = await Promise.all([listPlayersAction(id), getLiveRoundsAction(id)]);
  const locked = liveRounds.length > 0;

  return (
    <div>
      {!locked && <PlayerForm tournamentId={id} />}
      <PlayerTable tournamentId={id} players={players} locked={locked} />
    </div>
  );
}
