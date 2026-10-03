import { db } from '@/server/db/client';
import { renderStandingsPdf } from '@/server/services/export-service';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pdf = await renderStandingsPdf(db, id);
  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="standings.pdf"',
    },
  });
}
