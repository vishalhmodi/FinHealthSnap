#!/usr/bin/env node
/**
 * Seed script: populates the database with 2025-Q4 sample data.
 * Run: node prisma/seed.mjs
 */

import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const bcrypt = require('bcryptjs');

const dbAbsPath = resolve(process.cwd(), 'prisma/dev.db');
const adapter = new PrismaLibSql({ url: `file:${dbAbsPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database with 2025-Q4 data...');

  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: { email: 'user@example.com', passwordHash, name: 'Family' },
  });
  console.log(`✅ User: ${user.name} (${user.email})`);

  const categoryNames = ['TFSA', 'RRSP', 'RESP', 'General'];
  const categories = {};
  for (let i = 0; i < categoryNames.length; i++) {
    const cat = await prisma.accountCategory.upsert({
      where: { userId_name: { userId: user.id, name: categoryNames[i] } },
      update: {},
      create: { userId: user.id, name: categoryNames[i], sortOrder: i },
    });
    categories[cat.name] = cat.id;
  }
  console.log(`✅ Categories: ${Object.keys(categories).join(', ')}`);

  const institutionNames = ['TD', 'RBC', 'RBC2', 'SunLife', 'Manulife'];
  const institutions = {};
  for (const name of institutionNames) {
    const inst = await prisma.institution.upsert({
      where: { userId_name: { userId: user.id, name } },
      update: {},
      create: { userId: user.id, name },
    });
    institutions[name] = inst.id;
  }
  console.log(`✅ Institutions created`);

  const ownerNames = ['John', 'Jane', 'Family', 'Kids'];
  const owners = {};
  for (const name of ownerNames) {
    const owner = await prisma.owner.upsert({
      where: { userId_name: { userId: user.id, name } },
      update: {},
      create: { userId: user.id, name },
    });
    owners[name] = owner.id;
  }
  console.log(`✅ Owners created`);

  const accountDefs = [
    { category: 'TFSA', institution: 'TD', owner: 'John' },
    { category: 'TFSA', institution: 'RBC', owner: 'John' },
    { category: 'TFSA', institution: 'RBC2', owner: 'John' },
    { category: 'TFSA', institution: 'TD', owner: 'Jane' },
    { category: 'TFSA', institution: 'RBC', owner: 'Jane' },
    { category: 'TFSA', institution: 'RBC2', owner: 'Jane' },
    { category: 'RRSP', institution: 'TD', owner: 'John' },
    { category: 'RRSP', institution: 'RBC', owner: 'John' },
    { category: 'RRSP', institution: 'RBC2', owner: 'John' },
    { category: 'RRSP', institution: 'SunLife', owner: 'John' },
    { category: 'RRSP', institution: 'Manulife', owner: 'John' },
    { category: 'RRSP', institution: 'TD', owner: 'Jane' },
    { category: 'RRSP', institution: 'RBC', owner: 'Jane' },
    { category: 'RRSP', institution: 'RBC2', owner: 'Jane' },
    { category: 'RRSP', institution: 'SunLife', owner: 'Jane' },
    { category: 'RRSP', institution: 'Manulife', owner: 'Jane' },
    { category: 'RESP', institution: 'TD', owner: 'Kids' },
    { category: 'RESP', institution: 'RBC', owner: 'Kids' },
    { category: 'General', institution: 'TD', owner: 'John' },
    { category: 'General', institution: 'RBC', owner: 'John' },
    { category: 'General', institution: 'TD', owner: 'Jane' },
    { category: 'General', institution: 'RBC', owner: 'Jane' },
  ];

  const accountMap = {};
  for (const def of accountDefs) {
    const existing = await prisma.account.findFirst({
      where: {
        userId: user.id,
        categoryId: categories[def.category],
        institutionId: institutions[def.institution],
        ownerId: owners[def.owner],
      },
    });
    const account = existing ?? await prisma.account.create({
      data: {
        userId: user.id,
        categoryId: categories[def.category],
        institutionId: institutions[def.institution],
        ownerId: owners[def.owner],
      },
    });
    accountMap[`${def.category}:${def.institution}:${def.owner}`] = account.id;
  }
  console.log(`✅ Accounts: ${Object.keys(accountMap).length} created`);

  const quarter = await prisma.quarter.upsert({
    where: { userId_label: { userId: user.id, label: '2025-Q4' } },
    update: {},
    create: {
      userId: user.id,
      label: '2025-Q4',
      snapshotDate: new Date('2026-01-26'),
      notes: 'Initial quarterly snapshot - imported from Excel',
    },
  });
  console.log(`✅ Quarter: ${quarter.label}`);

  const balanceSeed = [
    { catName: 'TFSA', instName: 'TD', ownerName: 'John', amount: 100 },
    { catName: 'RRSP', instName: 'TD', ownerName: 'John', amount: 200 },
    { catName: 'RRSP', instName: 'TD', ownerName: 'Jane', amount: 300 },
    { catName: 'RESP', instName: 'TD', ownerName: 'Kids', amount: 500 },
  ];

  for (const bs of balanceSeed) {
    const accountId = accountMap[`${bs.catName}:${bs.instName}:${bs.ownerName}`];
    if (!accountId) continue;
    await prisma.accountBalance.upsert({
      where: { accountId_quarterId: { accountId, quarterId: quarter.id } },
      update: { amount: bs.amount },
      create: { accountId, quarterId: quarter.id, amount: bs.amount },
    });
  }
  console.log(`✅ Account balances seeded`);

  const customItems = [
    { name: 'Primary House', detail: 'Equity', itemType: 'ASSET', amount: 10000, sortOrder: 0 },
    { name: 'Primary House', detail: 'Mortgage', itemType: 'LIABILITY', amount: 5000, sortOrder: 1 },
    { name: 'Invest. House-1', detail: 'Equity', itemType: 'ASSET', amount: 20000, sortOrder: 2 },
    { name: 'Invest. House-1', detail: 'Mortgage', itemType: 'LIABILITY', amount: 15000, sortOrder: 3 },
    { name: 'Heloc', detail: 'PrimaryHouse', itemType: 'LIABILITY', amount: 30000, sortOrder: 4 },
  ];

  for (const item of customItems) {
    const existing = await prisma.customAssetLiability.findFirst({
      where: { quarterId: quarter.id, userId: user.id, name: item.name, detail: item.detail },
    });
    if (!existing) {
      await prisma.customAssetLiability.create({
        data: { userId: user.id, quarterId: quarter.id, ...item },
      });
    }
  }
  console.log(`✅ Custom assets/liabilities seeded`);
  console.log('\n🎉 Seed complete!');
  console.log('   Login: user@example.com / password123');
  console.log('   Assets: $31,200 | Liabilities: $50,000 | Net Worth: -$18,800');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
