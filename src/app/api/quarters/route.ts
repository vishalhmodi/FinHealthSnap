import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/quarters — list all quarters for the authenticated user
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const quartersRaw = await prisma.quarter.findMany({
    where: { userId: user.userId },
    orderBy: { snapshotDate: 'desc' },
    include: {
      balances: true,
      customItems: true
    }
  });

  const quarters = quartersRaw.map(q => {
    const totalAccountAssets = q.balances.reduce((sum, b) => sum + b.amount, 0);
    const totalCustomAssets = q.customItems.filter(c => c.itemType === 'ASSET').reduce((s, c) => s + c.amount, 0);
    const totalLiabilities = q.customItems.filter(c => c.itemType === 'LIABILITY').reduce((s, c) => s + c.amount, 0);
    
    const totalAssets = totalAccountAssets + totalCustomAssets;
    const netWorth = totalAssets - totalLiabilities;
    
    return {
      id: q.id,
      label: q.label,
      snapshotDate: q.snapshotDate,
      notes: q.notes,
      createdAt: q.createdAt,
      totalAssets,
      totalLiabilities,
      netWorth
    };
  });

  return NextResponse.json(quarters);
}

// POST /api/quarters — create a new quarter
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { label, snapshotDate, notes, carryFromQuarterId } = await request.json();
  if (!label || !snapshotDate) {
    return NextResponse.json({ error: 'label and snapshotDate are required' }, { status: 400 });
  }

  const quarter = await prisma.quarter.create({
    data: {
      userId: user.userId,
      label,
      snapshotDate: new Date(snapshotDate),
      notes,
    },
  });

  // Auto-carry account balances from previous quarter if requested
  if (carryFromQuarterId) {
    const prevBalances = await prisma.accountBalance.findMany({
      where: { quarterId: carryFromQuarterId },
    });
    if (prevBalances.length > 0) {
      await prisma.accountBalance.createMany({
        data: prevBalances.map((b) => ({
          accountId: b.accountId,
          quarterId: quarter.id,
          amount: b.amount,
        })),
      });
    }

    // Carry custom items
    const prevCustom = await prisma.customAssetLiability.findMany({
      where: { quarterId: carryFromQuarterId, userId: user.userId },
    });
    if (prevCustom.length > 0) {
      await prisma.customAssetLiability.createMany({
        data: prevCustom.map((c) => ({
          userId: user.userId,
          quarterId: quarter.id,
          name: c.name,
          detail: c.detail,
          itemType: c.itemType,
          amount: c.amount,
          sortOrder: c.sortOrder,
        })),
      });
    }
  } else {
    // Start with blank balances: populate all active accounts with $0
    const activeAccounts = await prisma.account.findMany({
      where: { userId: user.userId, isActive: true },
    });
    if (activeAccounts.length > 0) {
      await prisma.accountBalance.createMany({
        data: activeAccounts.map((a) => ({
          accountId: a.id,
          quarterId: quarter.id,
          amount: 0,
        })),
      });
    }
  }

  return NextResponse.json(quarter, { status: 201 });
}
