# Chronological Execution Plan - FinHealthSnap

This document outlines the detailed development phases and milestones for building the Quarterly Asset & Liability Snapshot application.

---

## Development Milestones

```
┌────────────────────────────────────────────────────────┐
│  Phase 1: Environment Setup & Next.js Scaffold         │
├────────────────────────────────────────────────────────┤
│  Phase 2: Database Initialization & Prisma Migrations  │
├────────────────────────────────────────────────────────┤
│  Phase 3: Backend API Endpoints & Seed Script          │
├────────────────────────────────────────────────────────┤
│  Phase 4: Beautiful Front-End Views & CSS Styling      │
├────────────────────────────────────────────────────────┤
│  Phase 5: Financial Health Charts & Trends             │
├────────────────────────────────────────────────────────┤
│  Phase 6: Print-to-PDF Layout Optimization & Launch   │
└────────────────────────────────────────────────────────┘
```

---

## Detailed Phases

### Phase 1: Environment Setup & Next.js Scaffold
- [ ] Check / Install Node.js LTS via Homebrew if approved by user.
- [ ] Scaffold Next.js application in current directory (`/Users/vicky/Projects/QtrlyAssetLiabilitySnapshot`) using a clean, non-interactive command setup.
- [ ] Install required core production dependencies: `prisma`, `@prisma/client`, `recharts` (or `chart.js`), and typical developer icons.
- [ ] Verify standard directory structure.

### Phase 2: Database Initialization & Prisma Migrations
- [ ] Configure `prisma/schema.prisma` with our robust multi-tenant ready schema.
- [ ] Run first migration to initialize `dev.db` (SQLite): `npx prisma migrate dev --name init`.
- [ ] Generate Prisma Client bindings: `npx prisma generate`.

### Phase 3: Backend API Endpoints & Seed Script
- [ ] Create seed script `prisma/seed.ts` to populate the database with the exact values from the 2025-Q4 spreadsheet.
- [ ] Write backend API handlers under Next.js App Router API directory:
  - `GET /api/quarters`: Fetch snapshots list.
  - `POST /api/quarters`: Create new quarters (with auto-carry from previous quarter's accounts).
  - `GET /api/quarters/[id]`: Retrieve single snapshot data.
  - `PUT /api/quarters/[id]`: Save updated balances and custom assets/liabilities.
  - `GET /api/dashboard`: Fetch trends (Asset, Liability, Net Worth aggregations for charts).

### Phase 4: Beautiful Front-End Views & CSS Styling
- [ ] Create `index.css` or core global styles setting up variables, Outfit typography, and reset rules.
- [ ] Build glassmorphic Layout wrapper with side navigation and top app header.
- [ ] Build a sleek landing view/dashboard with summary widgets.
- [ ] Build the dynamic snapshot spreadsheet grid:
  - Investment Summary table.
  - Institution Summary table.
  - Breakdowns for TFSA, RRSP, RESP, and General.
  - Asset/Liability custom inputs panel on the right.
  - Toggle between Interactive Edit Grid and crisp View Mode.

### Phase 5: Financial Health Charts & Trends
- [ ] Integrate Charting widgets in the main dashboard using Recharts or Chart.js.
- [ ] Model Net Worth growth trend curves, Asset vs. Liability stacked bars, and Category allocations.
- [ ] Polish hover tooltips and ensure charts dynamically resize.

### Phase 6: Print-to-PDF Layout Optimization & Launch
- [ ] Build `@media print` CSS rules in the CSS Modules stylesheet.
- [ ] Design a dedicated high-fidelity report print layout.
- [ ] Add the "Save Report as PDF" button that triggers `window.print()` seamlessly.
- [ ] Conduct validation checks against initial spreadsheet amounts.
- [ ] Deliver the final walkthrough.
