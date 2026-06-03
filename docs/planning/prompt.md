# Original Prompt & Requirements

This document captures the original user request and constraints for the Quarterly Asset & Liability Snapshot project.

---

## User Request

> Every quarter I manually capture and create excel in this format (attached image). That list down all the investment we have in family and liabiltiy. It helps me track my finance. I now want to create this as an application so that When I enter these numbers from front end they get stored in database and can be retrieved from the database from UI can be edited and saved back. Once they are added/updated every quarter, I should be able to create a snapshot report similar to attached one or better than that and print that in pdf format. additionally I should be able to track down financial health quarterly yearly... both investment and liabilities. So it will help me figure my progress and any improvement I can make.
>
> Create docs folder for any document that you would create for it, whether it is first prompt.md, design.md, plan.md or implementation.md etc. And create folder structure as per the standard programming practice. You may choose whatever technology stack you like. But keep in mind that I want to host it in future and user can add their financials to generate such reports. so kind of multitenant application... it probably can be mobile phone compatibile application too. but that is future enhancement... not for now.

---

## Core Deliverables

1. **Front-End Data Entry**: Elegant data entry grid representing a unified snapshot matrix.
2. **Persistent Storage**: Robust database tracking all historical snapshots.
3. **Editable Retrieval**: Load any historical quarter's snapshot, edit values, and save updates.
4. **Snapshot PDF Report**: A clean, single-page, print-ready layout that exports perfectly as a PDF.
5. **Aesthetic Dashboard**: Premium visual styling (dark glassmorphism, responsive elements, sleek animations).
6. **Financial Health Analytics**: Interactive quarterly/yearly health tracking metrics (Net Worth growth, assets/liabilities trends, performance progress, waterfall chart).
7. **Multi-Tenant Foundation**: Scope all database schemas cleanly by user IDs to simplify future cloud hosting scaling.
8. **Documentation Structure**: Build documents in a standard `docs` folder inside the workspace.
