import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');

  try {
    if (type === 'CATEGORY') {
      const inUse = await prisma.account.findFirst({ where: { categoryId: id } });
      if (inUse) return NextResponse.json({ error: 'Cannot delete: This Investment Type is in use by an existing account.' }, { status: 400 });
      await prisma.accountCategory.delete({ where: { id, userId: user.userId } });
    } else if (type === 'OWNER') {
      const inUse = await prisma.account.findFirst({ where: { ownerId: id } });
      if (inUse) return NextResponse.json({ error: 'Cannot delete: This Owner is in use by an existing account.' }, { status: 400 });
      await prisma.owner.delete({ where: { id, userId: user.userId } });
    } else if (type === 'INSTITUTION') {
      const inUse = await prisma.account.findFirst({ where: { institutionId: id } });
      if (inUse) return NextResponse.json({ error: 'Cannot delete: This Institution is in use by an existing account.' }, { status: 400 });
      await prisma.institution.delete({ where: { id, userId: user.userId } });
    } else if (type === 'CUSTOM_CATEGORY') {
      await prisma.customItemCategory.delete({ where: { id, userId: user.userId } });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting setting:', error);
    return NextResponse.json({ error: 'Failed to delete item.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  const body = await request.json();
  const { isExcluded } = body;

  if (typeof isExcluded !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload: isExcluded must be a boolean' }, { status: 400 });
  }

  try {
    let updated;
    if (type === 'CATEGORY') {
      updated = await prisma.accountCategory.update({
        where: { id, userId: user.userId },
        data: { isExcluded }
      });
    } else if (type === 'OWNER') {
      updated = await prisma.owner.update({
        where: { id, userId: user.userId },
        data: { isExcluded }
      });
    } else if (type === 'INSTITUTION') {
      updated = await prisma.institution.update({
        where: { id, userId: user.userId },
        data: { isExcluded }
      });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json({ error: 'Failed to update item.' }, { status: 500 });
  }
}
