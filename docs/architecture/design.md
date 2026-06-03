# Technical Design Document - FinHealthSnap

This document outlines the technical design, database schema, premium UX system, and architectural plans for the Quarterly Asset & Liability Snapshot application.

---

## 1. System Architecture

To ensure a robust, high-fidelity, and easily hostable application that can scale to a multi-tenant cloud setup in the future, we utilize a full-stack, single-repo React architecture.

```
┌────────────────────────────────────────────────────────┐
│                      Client Browser                     │
│  ┌───────────────────────┐   ┌──────────────────────┐  │
│  │   Interactive UI      │   │   @media print       │  │
│  │ (Dashboard, Grid Form)│   │ (Clean PDF Snapshot) │  │
│  └───────────┬───────────┘   └──────────┬───────────┘  │
└──────────────┼──────────────────────────┼──────────────┘
               │ JSON / HTTP              │ Trigger Print
               ▼                          ▼
┌────────────────────────────────────────────────────────┐
│                   Next.js Web Server                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │                   API Routes                     │  │
│  │  (Dashboard Calculations, CRUD Snapshots, Auth)  │  │
│  └───────────────────┬──────────────────────────────┘  │
└──────────────────────┼─────────────────────────────────┘
                       │ Prisma Client (ORM)
                       ▼
┌────────────────────────────────────────────────────────┐
│                   Database Layer                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │              SQLite (Development)                │  │
│  │           PostgreSQL (Future Cloud)              │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### Stack Components
- **Framework**: **Next.js (App Router)** - Standard React full-stack framework offering fast routing, built-in REST API endpoints, and static/server rendering.
- **ORM**: **Prisma ORM** - High-productivity database toolkit providing auto-generated TypeScript clients, easy schema modeling, and zero-effort schema migrations.
- **Database**: **SQLite** (local file-based, requiring no external setup) for developer ease, easily migratable to **PostgreSQL** for multi-tenant production hosting in the future.
- **Styling**: **Vanilla CSS / CSS Modules** - Premium, highly customized CSS using variables, flexbox/grid layout systems, glassmorphic styling, and fluid motion. No bloating third-party utility frameworks.
- **Charts**: **Recharts** or **Chart.js** - Sleek, lightweight, SVG/Canvas-based financial trend charting libraries.
- **PDF Engine**: Standard Web Print APIs customized with optimized CSS layouts.

---

## 2. Database Schema (Prisma)

The schema is normalized to prevent redundant records, support infinite flexibility in account names, categories, and owners, and strictly isolates all records by `userId` to ensure immediate multi-tenancy support.

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

// 1. Multi-Tenant User Model
model User {
  id           String      @id @default(uuid())
  email        String      @unique
  passwordHash String
  name         String
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  
  quarters     Quarter[]
  categories   AccountCategory[]
  institutions Institution[]
  owners       Owner[]
  accounts     Account[]
  customItems  CustomAssetLiability[]
}

// 2. Quarterly Snapshot Metadata
model Quarter {
  id           String      @id @default(uuid())
  userId       String
  user         User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  label        String      // e.g. "2025-Q4"
  snapshotDate DateTime    // e.g. 2026-01-26
  createdAt    DateTime    @default(now())
  
  balances     AccountBalance[]
  customItems  CustomAssetLiability[]

  @@unique([userId, label])
}

// 3. Dynamic Investment Categories
model AccountCategory {
  id        String    @id @default(uuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String    // e.g. "TFSA", "RRSP", "RESP", "General"
  createdAt DateTime  @default(now())
  
  accounts  Account[]

  @@unique([userId, name])
}

// 4. Financial Institutions / Banks
model Institution {
  id        String    @id @default(uuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String    // e.g. "TD", "RBC", "SunLife", "Manulife"
  createdAt DateTime  @default(now())
  
  accounts  Account[]

  @@unique([userId, name])
}

// 5. Asset/Liability Owners
model Owner {
  id        String    @id @default(uuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String    // e.g. "John", "Jane", "Family", "Kids"
  createdAt DateTime  @default(now())
  
  accounts  Account[]

  @@unique([userId, name])
}

// 6. Registered Accounts
model Account {
  id            String          @id @default(uuid())
  userId        String
  user          User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  categoryId    String
  category      AccountCategory @relation(fields: [categoryId], references: [id])
  institutionId String
  institution   Institution     @relation(fields: [institutionId], references: [id])
  ownerId       String
  owner         Owner           @relation(fields: [ownerId], references: [id])
  name          String?         // Optional sub-identifier (e.g. "TFSA Account 2")
  isActive      Boolean         @default(true)
  createdAt     DateTime        @default(now())
  
  balances      AccountBalance[]
}

// 7. Core Balances per Account per Quarter
model AccountBalance {
  id        String   @id @default(uuid())
  accountId String
  account   Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  quarterId String
  quarter   Quarter  @relation(fields: [quarterId], references: [id], onDelete: Cascade)
  amount    Float    // Balance (always >= 0, e.g. 50000.00)
  updatedAt DateTime @updatedAt

  @@unique([accountId, quarterId])
}

// 8. Custom Real Estate / Liabilities Panel
model CustomAssetLiability {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  quarterId String
  quarter   Quarter  @relation(fields: [quarterId], references: [id], onDelete: Cascade)
  name      String   // e.g. "Primary House", "Invest. House-1", "Heloc"
  detail    String   // e.g. "Equity", "Mortgage", "PrimaryHouse"
  type      String   // "ASSET" or "LIABILITY" (determining if positive or negative)
  amount    Float    // Raw absolute amount (e.g. 30000.00)
  updatedAt DateTime @updatedAt
}
```

---

## 3. Premium UI/UX Style Guide

The visual design is structured to deliver an immediate premium "wow" factor, stepping far beyond raw tabular data.

### Palette & Design System (CSS Variables)
We implement a modern, harmonized Dark Glassmorphism color palette with CSS variables for dynamic adaptability:

```css
:root {
  --bg-main: #0B0F19;           /* Deep dark obsidian base */
  --bg-surface: rgba(20, 27, 45, 0.7); /* Translucent midnight glass */
  --bg-card: rgba(30, 41, 67, 0.45);   /* Elevated translucent container */
  --border-glass: rgba(255, 255, 255, 0.08); /* Clean, ultra-thin glass border */
  
  /* Harmonious Tailwind-like HSL tailored color accents */
  --color-primary: #6366F1;     /* Vibrant Indigo */
  --color-secondary: #06B6D4;   /* Sleek Teal */
  
  /* Financial Context Colors */
  --color-asset: #10B981;       /* Emerald Green ($31,200.00) */
  --color-asset-light: rgba(16, 185, 129, 0.15);
  
  --color-liability: #EF4444;   /* Rose Red (-$50,000.00) */
  --color-liability-light: rgba(239, 68, 68, 0.15);
  
  --color-networth: #6366F1;    /* Vibrant Indigo accent ($18,800.00) */
  
  /* Typography Variables */
  --font-family: 'Outfit', 'Inter', system-ui, sans-serif;
  --text-main: #F3F4F6;         /* High contrast grey-white */
  --text-muted: #9CA3AF;        /* Mid-tone slate grey */
}
```

### Visual Polish Elements
- **Glassmorphism Backdrop Filter**: All cards, modals, and navigation elements feature `backdrop-filter: blur(16px); border: 1px solid var(--border-glass);` to generate an elegant, layered visual depth.
- **Dynamic Hover Animations**: Interactive table elements and buttons expand and glow subtly: `transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);`
- **Micro-animations**: Subtle keyframe pulse and slide-in animations when the dashboard or reports render.
- **Font Typography**: Embed Google Font `Outfit` to deliver clean, modern financial numbers and clear table interfaces.

---

## 4. Report Print Layout Strategy (@media print)

To create a flawless, pixel-perfect PDF snapshot of the spreadsheet reports:
1. We design a dedicated print stylesheet within the dashboard CSS module:
   ```css
   @media print {
     body {
       background: #FFFFFF !important;
       color: #000000 !important;
     }
     
     /* Hide navigation, footers, buttons, and dashboard sidebars */
     .sidebar, .actionButtons, .navHeader, .interactiveControls {
       display: none !important;
     }
     
     /* Restructure grid to fit cleanly on standard Letter-size portrait or landscape pages */
     .printContainer {
       width: 100% !important;
       max-width: 100% !important;
       margin: 0 !important;
       padding: 0 !important;
       grid-template-columns: 1fr !important;
     }
     
     /* Convert dark glass design variables into elegant high-contrast print styles */
     .reportCard {
       background: #FFFFFF !important;
       border: 1px solid #E5E7EB !important;
       box-shadow: none !important;
       color: #111827 !important;
     }
   }
   ```
2. Trigger the PDF creation natively using `window.print()` via a premium "Export Snapshot to PDF" button on the UI, which opens the browser's high-fidelity print system natively with these pre-optimized stylesheets.

---

## 5. Multi-Tenancy Design Plan

While starting as a single-family application, the system is designed to seamlessly support multiple tenants in the future:
1. **User Scope**: Every dynamic resource (`Quarter`, `Account`, `Category`, `Institution`, `CustomAssetLiability`) is indexed by a `userId`.
2. **Global Queries**: The backend uses an authentication middleware. Every database query automatically appends `where: { userId: currentSessionUserId }`.
3. **Stateless Operations**: No global or local singleton database cache is used; each request is completely stateless and handles its context cleanly via React contexts.
4. **Cloud Migration Path**: Upgrading the application to support remote cloud users simply requires deploying to a PostgreSQL host (e.g. Vercel, Neon, Supabase) and updating the `DATABASE_URL` environment variable inside Prisma, with zero code alterations required!
