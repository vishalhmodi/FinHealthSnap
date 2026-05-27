import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

// GET /api/quarters/[id] — full snapshot data
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const quarter = await prisma.quarter.findFirst({
    where: { id, userId: user.userId },
    include: {
      balances: {
        include: {
          account: {
            include: {
              category: true,
              institution: true,
              owner: true,
            },
          },
        },
      },
      customItems: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!quarter) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(quarter);
}

// PUT /api/quarters/[id] — save updated balances and custom items
export async function PUT(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { balances, customItems, notes } = await request.json();

  const quarter = await prisma.quarter.findFirst({ where: { id, userId: user.userId } });
  if (!quarter) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Update notes if provided
  if (notes !== undefined) {
    await prisma.quarter.update({ where: { id }, data: { notes } });
  }

  // Upsert account balances
  if (balances && Array.isArray(balances)) {
    for (const b of balances as { accountId: string; amount: number }[]) {
      await prisma.accountBalance.upsert({
        where: { accountId_quarterId: { accountId: b.accountId, quarterId: id } },
        update: { amount: b.amount },
        create: { accountId: b.accountId, quarterId: id, amount: b.amount },
      });
    }
  }

  // Upsert custom items and delete missing ones
  if (customItems && Array.isArray(customItems)) {
    const providedIds = customItems.map((c: any) => c.id).filter(Boolean);
    await prisma.customAssetLiability.deleteMany({
      where: { quarterId: id, id: { notIn: providedIds } },
    });
    for (const item of customItems as {
      id?: string;
      name: string;
      detail: string;
      itemType: string;
      amount: number;
      sortOrder?: number;
    }[]) {
      if (item.id) {
        await prisma.customAssetLiability.update({
          where: { id: item.id },
          data: { amount: item.amount, name: item.name, detail: item.detail, itemType: item.itemType, sortOrder: item.sortOrder ?? 0 },
        });
      } else {
        await prisma.customAssetLiability.create({
          data: {
            userId: user.userId,
            quarterId: id,
            name: item.name,
            detail: item.detail,
            itemType: item.itemType,
            amount: item.amount,
            sortOrder: item.sortOrder ?? 0,
          },
        });
      }
    }
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/quarters/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const quarter = await prisma.quarter.findFirst({ where: { id, userId: user.userId } });
  if (!quarter) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.quarter.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
