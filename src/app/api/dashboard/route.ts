import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sortQuarterLabels } from '@/lib/utils';

// GET /api/dashboard — aggregated financial health data for charts
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const quarters = await prisma.quarter.findMany({
    where: { userId: user.userId },
    include: {
      balances: { 
        include: { 
          account: { 
            include: { category: true, institution: true, owner: true } 
          } 
        } 
      },
      customItems: true,
    },
    orderBy: { label: 'asc' },
  });

  const sorted = sortQuarterLabels(quarters.map((q) => q.label));

  const trends = sorted.map((label) => {
    const q = quarters.find((x) => x.label === label)!;

    const accountAssets = q.balances.reduce((sum, b) => sum + b.amount, 0);
    const customAssets = q.customItems
      .filter((c) => c.itemType === 'ASSET')
      .reduce((sum, c) => sum + c.amount, 0);
    const customLiabilities = q.customItems
      .filter((c) => c.itemType === 'LIABILITY')
      .reduce((sum, c) => sum + c.amount, 0);

    const totalAssets = accountAssets + customAssets;
    const totalLiabilities = customLiabilities;
    const netWorth = totalAssets - totalLiabilities;

    const categoryMap: Record<string, number> = {};
    const institutionMap: Record<string, number> = {};
    const ownerMap: Record<string, number> = {};
    const nonLiquidMap: Record<string, number> = {};
    const liabilityMap: Record<string, number> = {};

    for (const b of q.balances) {
      const cat = b.account.category.name;
      categoryMap[cat] = (categoryMap[cat] ?? 0) + b.amount;

      const inst = b.account.institution.name;
      institutionMap[inst] = (institutionMap[inst] ?? 0) + b.amount;

      const owner = b.account.owner.name;
      ownerMap[owner] = (ownerMap[owner] ?? 0) + b.amount;
    }

    for (const c of q.customItems) {
      const displayName = c.category ? `${c.name} - ${c.category}` : c.name;
      if (c.itemType === 'ASSET') {
        nonLiquidMap[displayName] = (nonLiquidMap[displayName] ?? 0) + c.amount;
      } else if (c.itemType === 'LIABILITY') {
        liabilityMap[displayName] = (liabilityMap[displayName] ?? 0) + c.amount;
      }
    }

    // Detailed Items for Waterfall
    const itemsMap = new Map<string, { name: string; type: 'ASSET' | 'LIABILITY'; amount: number }>();

    for (const b of q.balances) {
      if (b.amount === 0) continue;
      const name = `${b.account.category.name} - ${b.account.owner.name}`;
      const key = `${name}::ASSET`;
      
      const existing = itemsMap.get(key);
      if (existing) {
        existing.amount += b.amount;
      } else {
        itemsMap.set(key, { name, type: 'ASSET', amount: b.amount });
      }
    }

    for (const c of q.customItems) {
      if (c.amount === 0) continue;
      const displayName = c.category ? `${c.name} - ${c.category}` : c.name;
      const key = `${displayName}::${c.itemType}`;
      
      const existing = itemsMap.get(key);
      if (existing) {
        existing.amount += c.amount;
      } else {
        itemsMap.set(key, { name: displayName, type: c.itemType as 'ASSET' | 'LIABILITY', amount: c.amount });
      }
    }

    const items = Array.from(itemsMap.values());

    items.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'ASSET' ? -1 : 1;
      return b.amount - a.amount;
    });

    return {
      label: q.label,
      quarterId: q.id,
      snapshotDate: q.snapshotDate,
      totalAssets,
      liquidAssets: accountAssets,
      nonLiquidAssets: customAssets,
      totalLiabilities,
      netWorth,
      categoryBreakdown: categoryMap,
      institutionBreakdown: institutionMap,
      ownerBreakdown: ownerMap,
      nonLiquidBreakdown: nonLiquidMap,
      liabilityBreakdown: liabilityMap,
      items,
    };
  });

  // Latest quarter summary
  const latest = trends[trends.length - 1] ?? null;

  return NextResponse.json({ trends, latest });
}
