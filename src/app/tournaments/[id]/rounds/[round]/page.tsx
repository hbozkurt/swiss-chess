import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PairingTable } from '@/components/rounds/PairingTable';
import { GenerateRoundButton } from '@/components/rounds/GenerateRoundButton';
import { getTournamentAction } from '@/server/actions/tournament-actions';
import { getLiveRoundsAction, getRoundGamesAction } from '@/server/actions/round-actions';
import { listPlayersAction } from '@/server/actions/player-actions';

export const dynamic = 'force-dynamic';

export default async function RoundPage({ params }: { params: Promise<{ id: string; round: string }> }) {
  const { id, round } = await params;
  const roundNumber = Number.parseInt(round, 10);

  const tournament = await getTournamentAction(id);
  if (!tournament) notFound();

  const [liveRounds, games, players] = await Promise.all([
    getLiveRoundsAction(id),
    getRoundGamesAction(id, roundNumber),
    listPlayersAction(id),
  ]);

  const activePlayers = players.filter((p) => p.withdrawnAt === null);
  const latestRoundNumber = liveRounds.length > 0 ? liveRounds[liveRounds.length - 1]!.roundNumber : 0;
  const isLatestRound = roundNumber === latestRoundNumber;
  const allResultsEntered = games.length > 0 && games.every((g) => g.result !== null);
  const canGenerateNext = isLatestRound && allResultsEntered && liveRounds.length < tournament.totalRounds;
  const needsFirstRound = liveRounds.length === 0;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2 text-sm">
          {liveRounds.map((r) => (
            <Link
              key={r.id}
              href={`/tournaments/${id}/rounds/${r.roundNumber}`}
              className={`rounded px-2 py-1 ${
                r.roundNumber === roundNumber ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              Round {r.roundNumber}
            </Link>
          ))}
        </div>
        <a
          href={`/api/tournaments/${id}/export/pairing-sheet.pdf?round=${roundNumber}`}
          className="text-xs text-zinc-500 hover:underline"
        >
          Export pairing sheet (PDF)
        </a>
      </div>

      {needsFirstRound ? (
        activePlayers.length < 2 ? (
          <p className="text-sm text-zinc-500">Register at least 2 players before generating Round 1.</p>
        ) : (
          <GenerateRoundButton tournamentId={id} />
        )
      ) : (
        <>
          <PairingTable tournamentId={id} games={games} />
          <div className="mt-4">
            {canGenerateNext && <GenerateRoundButton tournamentId={id} />}
            {isLatestRound && !allResultsEntered && (
              <p className="text-sm text-zinc-500">Enter all results to generate the next round.</p>
            )}
            {isLatestRound && liveRounds.length >= tournament.totalRounds && (
              <p className="text-sm font-medium text-emerald-700">
                All {tournament.totalRounds} rounds complete — see Standings for final results.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
