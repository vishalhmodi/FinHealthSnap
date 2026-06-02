import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/accounts — all accounts, categories, institutions, owners for the user
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [accounts, categories, institutions, owners, customItemCategories] = await Promise.all([
    prisma.account.findMany({
      where: { userId: user.userId, isActive: true },
      include: { category: true, institution: true, owner: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { owner: { name: 'asc' } }],
    }),
    prisma.accountCategory.findMany({ where: { userId: user.userId }, orderBy: { sortOrder: 'asc' } }),
    prisma.institution.findMany({ where: { userId: user.userId }, orderBy: { name: 'asc' } }),
    prisma.owner.findMany({ where: { userId: user.userId }, orderBy: { name: 'asc' } }),
    prisma.customItemCategory.findMany({ where: { userId: user.userId }, orderBy: { name: 'asc' } }),
  ]);

  return NextResponse.json({ accounts, categories, institutions, owners, customItemCategories });
}

// POST /api/accounts — create a new account (or return existing) and optionally initialize balance
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { categoryName, institutionName, ownerName, quarterId } = await request.json();

  // Upsert category, institution, and owner
  const [category, institution, owner] = await Promise.all([
    prisma.accountCategory.upsert({
      where: { userId_name: { userId: user.userId, name: categoryName } },
      update: {},
      create: { userId: user.userId, name: categoryName },
    }),
    prisma.institution.upsert({
      where: { userId_name: { userId: user.userId, name: institutionName } },
      update: {},
      create: { userId: user.userId, name: institutionName },
    }),
    prisma.owner.upsert({
      where: { userId_name: { userId: user.userId, name: ownerName } },
      update: {},
      create: { userId: user.userId, name: ownerName },
    }),
  ]);

  let account = await prisma.account.findFirst({
    where: {
      userId: user.userId,
      categoryId: category.id,
      institutionId: institution.id,
      ownerId: owner.id,
    },
    include: { category: true, institution: true, owner: true },
  });

  if (!account) {
    account = await prisma.account.create({
      data: {
        userId: user.userId,
        categoryId: category.id,
        institutionId: institution.id,
        ownerId: owner.id,
      },
      include: { category: true, institution: true, owner: true },
    });
  }

  // If a quarterId was provided, ensure an AccountBalance exists for it
  if (quarterId) {
    const existingBalance = await prisma.accountBalance.findUnique({
      where: { accountId_quarterId: { accountId: account.id, quarterId } }
    });
    if (!existingBalance) {
      await prisma.accountBalance.create({
        data: {
          accountId: account.id,
          quarterId,
          amount: 0,
        }
      });
    }
  }

  return NextResponse.json(account, { status: 201 });
}
