import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const dbPath = join(process.cwd(), 'prisma', 'dev.db');
    const fileBuffer = readFileSync(dbPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="FinanceSnap-Backup.db"',
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: 'Failed to generate backup' }, { status: 500 });
  }
}
