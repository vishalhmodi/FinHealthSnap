import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import bcrypt from 'bcryptjs';

const __dirname2 = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname2, 'dev.db');
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('Clearing existing data...');
  await prisma.accountBalance.deleteMany();
  await prisma.customAssetLiability.deleteMany();
  await prisma.quarter.deleteMany();
  await prisma.account.deleteMany();
  await prisma.accountCategory.deleteMany();
  await prisma.institution.deleteMany();
  await prisma.owner.deleteMany();
  await prisma.user.deleteMany();

  // Create User
  const passwordHash = await bcrypt.hash('password123', 10);
  // Create Main Family User
  // 5. Seed Quarters & Balances
  const rowData = [
    {
      label: '2021-Q1', date: '2021-01-01',
      values: [
        15350, 38872, 22032, 41012, 26118, 42025, 8705, 43912, // Jane
        98506.90, 15154, 8351, 1530, 26272, 48408, 19547, 18383, // John
        37952.20, 28460, // Family RESP
        126652.33, 10989, 3437 // General
      ]
    },
    {
      label: '2023-Q3', date: '2023-07-01',
      values: [
        12407, 2011, 31294, 22323, 4374, 16240, 22268, 14466, // Jane
        132459.70, 24678, 14694, 7421, 29375, 12543, 47189, 45448, // John
        44181.85, 49530, // Family RESP
        23504.44, 13538, 45767 // General
      ]
    },
    {
      label: '2024-Q1', date: '2024-01-01',
      values: [
        10978, 34072, 13034, 46003, 28754, 5224, 40432, 16735,
        12122, 19127, 26878, 2507, 34848, 19195, 21911, 13403,
        44713, 40818,
        8561, 17349, 11471
      ]
    },
    {
      label: '2024-Q2', date: '2024-04-01',
      values: [
        24748, 37062, 11236, 43524, 13295, 23161, 43200, 49226,
        26372, 37920, 21104, 1982, 35792, 49424, 9456, 38302,
        11485, 14675,
        25206, 14371, 36272
      ]
    },
    {
      label: '2024-Q3', date: '2024-07-01',
      values: [
        41862, 30270, 9005, 39755, 46194, 30606, 46639, 23485,
        6440, 29634, 39301, 15437, 20880, 38868, 24984, 2134,
        30130, 28216,
        23319, 36747, 2779
      ]
    },
    {
      label: '2024-Q4', date: '2024-10-01',
      values: [
        17075, 9935, 32376, 18866, 50910, 39931, 33541, 42385,
        17004, 15109, 26425, 7214, 49540, 47648, 31848, 12398,
        3279, 19116,
        6241, 4753, 22665
      ]
    },
    {
      label: '2025-Q1', date: '2025-01-01',
      values: [
        49083, 31207, 19945, 36086, 32073, 14072, 35910, 3392,
        23178, 21030, 6100, 29875, 7955, 41557, 16791, 1291,
        17880, 31525,
        3042, 36124, 39046
      ]
    },
    {
      label: '2025-Q2', date: '2025-04-01',
      values: [
        42835, 25947, 31522, 50859, 21328, 28825, 17458, 25588,
        13764, 14141, 12289, 16627, 21269, 22599, 22613, 10319,
        5422, 30762,
        44787, 5553, 48844
      ]
    },
    {
      label: '2026-Q2', date: '2026-05-26',
      values: [
        46896, 36356, 37094, 2970, 30561, 5086, 13443, 43230, // Jane
        215915, 22252, 35736, 31164, 50372, 48581, 8444, 21450, // John
        84546, 7355, // Family RESP
        108567, 18003, 5558, // General
        139937, 3799, 41587, 19010 // New appended accounts
      ],
      custom: [
        { name: 'Primary House', detail: '123 Main St', itemType: 'ASSET', amount: 1000000 },
        { name: 'Primary House-Mortgage', detail: '123 Main St', itemType: 'LIABILITY', amount: 316812 },
        { name: 'Primary House-Heloc', detail: '123 Main St', itemType: 'LIABILITY', amount: 358000 },
        { name: 'Investment House-Kingston', detail: '456 Oak Ave', itemType: 'ASSET', amount: 600000 },
        { name: 'Investment House-Kingston-Mortgage', detail: '456 Oak Ave', itemType: 'LIABILITY', amount: 508422 }
      ]
    }
  ];

  await createUserWithData(
    'user@example.com',
    'Family User',
    passwordHash,
    rowData
  );

  // Create Demo User (US)
  const demoPasswordHash = await bcrypt.hash('DemoPassword123', 10);
  await createUserWithData(
    'demo@snapshot.local',
    'Demo User',
    demoPasswordHash,
    rowData.slice(-4) // Just the last 4 quarters for the demo account
  );

  // Create Demo User (CA)
  const demoCAPasswordHash = await bcrypt.hash('DemoCAPassword123', 10);
  await createUserWithData(
    'demoCA@snapshot.local',
    'Canadian Demo User',
    demoCAPasswordHash,
    rowData.slice(-4) 
  );

  console.log('Database seeded successfully with Family and Demo data!');
}

async function createUserWithData(email: string, name: string, passwordHash: string, rows: any[]) {
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
    }
  });
  const userId = user.id;

  const isDemoUS = email === 'demo@snapshot.local';
  const isDemoCA = email === 'demoCA@snapshot.local';
  const isDemo = isDemoUS || isDemoCA;

  const jane = await prisma.owner.create({ data: { name: isDemoUS ? 'Alex' : isDemoCA ? 'Sam' : 'Jane', userId } });
  const john = await prisma.owner.create({ data: { name: isDemoUS ? 'Jordan' : isDemoCA ? 'Riley' : 'John', userId } });
  const family = await prisma.owner.create({ data: { name: isDemo ? 'Joint' : 'Family', userId } });
  const bob = await prisma.owner.create({ data: { name: isDemoUS ? 'Taylor' : isDemoCA ? 'Morgan' : 'Bob', userId } });
  const alice = await prisma.owner.create({ data: { name: isDemoUS ? 'Casey' : isDemoCA ? 'Jamie' : 'Alice', userId } });

  // 2. Create Institutions
  const sunlife = await prisma.institution.create({ data: { name: isDemoUS ? 'Vanguard' : 'SunLife', userId } });
  const manulife = await prisma.institution.create({ data: { name: isDemoUS ? 'Fidelity' : 'Manulife', userId } });
  const td = await prisma.institution.create({ data: { name: isDemoUS ? 'Chase' : 'TD', userId } });
  const rbc = await prisma.institution.create({ data: { name: isDemoUS ? 'Bank of America' : 'RBC', userId } });
  const investia = await prisma.institution.create({ data: { name: isDemoUS ? 'Charles Schwab' : 'Investia', userId } });

  // 3. Create Categories (Investment Types)
  const tfsa = await prisma.accountCategory.create({ data: { name: isDemoUS ? 'Roth IRA' : 'TFSA', userId } });
  const rrsp = await prisma.accountCategory.create({ data: { name: isDemoUS ? '401k' : 'RRSP', userId } });
  const resp = await prisma.accountCategory.create({ data: { name: isDemoUS ? '529 Plan' : 'RESP', userId } });
  const general = await prisma.accountCategory.create({ data: { name: isDemoUS ? 'Brokerage' : 'General', userId } });

  // 4. Create Accounts mapping exactly to the columns
  // Jane
  const janeSunlifeTfsa = await prisma.account.create({ data: { ownerId: jane.id, institutionId: sunlife.id, categoryId: tfsa.id, userId } });
  const janeManulifeRrsp = await prisma.account.create({ data: { ownerId: jane.id, institutionId: manulife.id, categoryId: rrsp.id, userId } });
  const janeTdTfsa = await prisma.account.create({ data: { ownerId: jane.id, institutionId: td.id, categoryId: tfsa.id, userId } });
  const janeTdRrsp = await prisma.account.create({ data: { ownerId: jane.id, institutionId: td.id, categoryId: rrsp.id, userId } });
  const janeRbcTfsa = await prisma.account.create({ data: { ownerId: jane.id, institutionId: rbc.id, categoryId: tfsa.id, userId } });
  const janeRbcRrsp = await prisma.account.create({ data: { ownerId: jane.id, institutionId: rbc.id, categoryId: rrsp.id, userId } });
  const janeInvestiaTfsa = await prisma.account.create({ data: { ownerId: jane.id, institutionId: investia.id, categoryId: tfsa.id, userId } });
  const janeInvestiaRrsp = await prisma.account.create({ data: { ownerId: jane.id, institutionId: investia.id, categoryId: rrsp.id, userId } });

  // John
  const johnSunlifeRrsp = await prisma.account.create({ data: { ownerId: john.id, institutionId: sunlife.id, categoryId: rrsp.id, userId } });
  const johnManulifeRrsp = await prisma.account.create({ data: { ownerId: john.id, institutionId: manulife.id, categoryId: rrsp.id, userId } });
  const johnTdTfsa = await prisma.account.create({ data: { ownerId: john.id, institutionId: td.id, categoryId: tfsa.id, userId } });
  const johnTdRrsp = await prisma.account.create({ data: { ownerId: john.id, institutionId: td.id, categoryId: rrsp.id, userId } });
  const johnRbcTfsa = await prisma.account.create({ data: { ownerId: john.id, institutionId: rbc.id, categoryId: tfsa.id, userId } });
  const johnRbcRrsp = await prisma.account.create({ data: { ownerId: john.id, institutionId: rbc.id, categoryId: rrsp.id, userId } });
  const johnInvestiaTfsa = await prisma.account.create({ data: { ownerId: john.id, institutionId: investia.id, categoryId: tfsa.id, userId } });
  const johnInvestiaRrsp = await prisma.account.create({ data: { ownerId: john.id, institutionId: investia.id, categoryId: rrsp.id, userId } });

  // Family (RESP & General)
  const familyTdResp = await prisma.account.create({ data: { ownerId: family.id, institutionId: td.id, categoryId: resp.id, userId } });
  const familyInvestiaResp = await prisma.account.create({ data: { ownerId: family.id, institutionId: investia.id, categoryId: resp.id, userId } });
  const johnTdGeneral = await prisma.account.create({ data: { ownerId: john.id, institutionId: td.id, categoryId: general.id, userId } });
  const janeTdGeneral = await prisma.account.create({ data: { ownerId: jane.id, institutionId: td.id, categoryId: general.id, userId } });
  const familyRbcGeneral = await prisma.account.create({ data: { ownerId: family.id, institutionId: rbc.id, categoryId: general.id, userId } });

  // New accounts from 2026-Q2 image
  const janeSunlifeRrsp = await prisma.account.create({ data: { ownerId: jane.id, institutionId: sunlife.id, categoryId: rrsp.id, userId } });
  const bobRbcTfsa = await prisma.account.create({ data: { ownerId: bob.id, institutionId: rbc.id, categoryId: tfsa.id, userId } });
  const aliceRbcTfsa = await prisma.account.create({ data: { ownerId: alice.id, institutionId: rbc.id, categoryId: tfsa.id, userId } });
  const familyRbcResp = await prisma.account.create({ data: { ownerId: family.id, institutionId: rbc.id, categoryId: resp.id, userId } });

  const accountsInOrder = [
    janeSunlifeTfsa, janeManulifeRrsp, janeTdTfsa, janeTdRrsp, janeRbcTfsa, janeRbcRrsp, janeInvestiaTfsa, janeInvestiaRrsp,
    johnSunlifeRrsp, johnManulifeRrsp, johnTdTfsa, johnTdRrsp, johnRbcTfsa, johnRbcRrsp, johnInvestiaTfsa, johnInvestiaRrsp,
    familyTdResp, familyInvestiaResp,
    johnTdGeneral, janeTdGeneral, familyRbcGeneral,
    // Appended new accounts
    janeSunlifeRrsp, bobRbcTfsa, aliceRbcTfsa, familyRbcResp
  ];

  for (const row of rows) {
    const quarter = await prisma.quarter.create({
      data: {
        userId,
        label: row.label,
        snapshotDate: new Date(row.date),
      }
    });

    for (let i = 0; i < row.values.length; i++) {
      let amount = row.values[i];
      if (email === 'user@example.com') amount = Math.round(amount / 0.70);
      if (isDemoUS) amount = amount * 0.85; 
      if (isDemoCA) amount = amount * 0.50; // Cut exactly in half per request
      
      if (amount > 0 || amount === 0) {
        await prisma.accountBalance.create({
          data: {
            quarterId: quarter.id,
            accountId: accountsInOrder[i].id,
            amount: amount
          }
        });
      }
    }

    if (row.custom) {
      for (const c of row.custom) {
        let cAmount = c.amount;
        if (email === 'user@example.com') cAmount = Math.round(cAmount / 0.70);
        if (isDemoUS) cAmount = cAmount * 0.85;
        if (isDemoCA) cAmount = cAmount * 0.50; // 1M * 0.50 = 500K
        
        // Ensure names and details are completely obfuscated for demo users
        const customName = isDemo 
          ? c.name.replace(/Kingston/g, isDemoCA ? 'Toronto Suburb' : 'Demo Area') 
          : c.name;
          
        const customDetail = isDemo
          ? c.detail.replace(/123 Main St|456 Oak Ave/g, isDemoCA ? '42 Maple Street' : '123 Demo Street')
          : c.detail;

        await prisma.customAssetLiability.create({
          data: {
            quarterId: quarter.id,
            userId: userId,
            name: customName,
            detail: customDetail,
            itemType: c.itemType as "ASSET" | "LIABILITY",
            amount: cAmount
          }
        });
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
