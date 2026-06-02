import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type, name } = await request.json();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  try {
    let result;
    if (type === 'CATEGORY') {
      result = await prisma.accountCategory.create({ data: { name, userId: user.userId } });
    } else if (type === 'OWNER') {
      result = await prisma.owner.create({ data: { name, userId: user.userId } });
    } else if (type === 'INSTITUTION') {
      result = await prisma.institution.create({ data: { name, userId: user.userId } });
    } else if (type === 'CUSTOM_CATEGORY_ASSET') {
      result = await prisma.customItemCategory.create({ data: { name, type: 'ASSET', userId: user.userId } });
    } else if (type === 'CUSTOM_CATEGORY_LIABILITY') {
      result = await prisma.customItemCategory.create({ data: { name, type: 'LIABILITY', userId: user.userId } });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating setting:', error);
    return NextResponse.json({ error: 'Failed to create item, maybe it already exists.' }, { status: 500 });
  }
}
