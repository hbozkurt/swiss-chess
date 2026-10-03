import { db } from '@/server/db/client';
import { renderPairingSheetPdf } from '@/server/services/export-service';
import * as roundRepo from '@/server/repositories/round-repo';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const roundParam = url.searchParams.get('round');
  const liveRounds = roundRepo.findLiveRounds(db, id);
  const roundNumber = roundParam ? Number.parseInt(roundParam, 10) : liveRounds[liveRounds.length - 1]?.roundNumber;

  if (!roundNumber) {
    return new Response('No rounds have been paired yet', { status: 404 });
  }

  const pdf = await renderPairingSheetPdf(db, id, roundNumber);
  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="pairing-sheet-round-${roundNumber}.pdf"`,
    },
  });
}
