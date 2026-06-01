import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sortQuarterLabels } from '@/lib/utils';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const quarters = await prisma.quarter.findMany({
      where: { userId: user.userId },
    include: {
      balances: { 
        include: { 
          account: { 
            include: { category: true } 
          } 
        } 
      },
      customItems: {
        include: {
          linkedLiabilities: true
        }
      },
    },
    orderBy: { label: 'asc' },
  });

  const sorted = sortQuarterLabels(quarters.map((q) => q.label));

  const trends = sorted.map((label) => {
    const q = quarters.find((x) => x.label === label)!;

    const liquidAssets = q.balances.reduce((sum, b) => sum + b.amount, 0);
    const nonLiquidAssets = q.customItems
      .filter((c) => c.itemType === 'ASSET')
      .reduce((sum, c) => sum + c.amount, 0);
    const totalLiabilities = q.customItems
      .filter((c) => c.itemType === 'LIABILITY')
      .reduce((sum, c) => sum + c.amount, 0);

    const totalAssets = liquidAssets + nonLiquidAssets;
    const netWorth = totalAssets - totalLiabilities;
    
    // Leverage Ratio
    const leverageRatio = totalAssets > 0 ? totalLiabilities / totalAssets : 0;
    
    // Liquidity Ratio
    const liquidityRatio = totalLiabilities > 0 ? liquidAssets / totalLiabilities : (liquidAssets > 0 ? 999 : 0);

    // Compute LTV for Linked Real Estate
    const properties = q.customItems
      .filter(c => c.itemType === 'ASSET')
      .map(asset => {
        const linkedDebt = (asset.linkedLiabilities || []).reduce((sum, liab) => sum + liab.amount, 0);
        return {
          id: asset.id,
          name: asset.name,
          detail: asset.detail,
          assetValue: asset.amount,
          linkedDebt,
          ltv: asset.amount > 0 ? linkedDebt / asset.amount : 0
        };
      })
      .filter(p => p.linkedDebt > 0); // Only include properties with linked debt

    return {
      quarterId: q.id,
      label: q.label,
      totalAssets,
      totalLiabilities,
      liquidAssets,
      netWorth,
      leverageRatio,
      liquidityRatio,
      properties
    };
  });

  const latest = trends[trends.length - 1] ?? null;

  return NextResponse.json({ trends, latest });
  } catch (error: any) {
    console.error('Lending Health API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
