import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  
  const account = await prisma.account.findFirst({
    where: { id, userId: user.userId },
  });

  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.account.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { isExcluded } = body;

  if (typeof isExcluded !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const account = await prisma.account.findFirst({
    where: { id, userId: user.userId },
  });

  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updatedAccount = await prisma.account.update({
    where: { id },
    data: { isExcluded },
  });

  return NextResponse.json(updatedAccount);
}
