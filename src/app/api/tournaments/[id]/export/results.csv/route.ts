import { db } from '@/server/db/client';
import { exportResultsCsv } from '@/server/services/export-service';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const csv = exportResultsCsv(db, id);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="results.csv"',
    },
  });
}
