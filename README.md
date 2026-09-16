# Nomads Boys Hostel — Manager

A Hostel Management System (HMS) web app for **Nomads Boys Hostel — G-12 near SLS School**.
Three hostels (A, C, D), nominal-stay members ("Nomads") + guests ("Guests"), with a
dedicated Finance module that handles per-assignment pricing and independent visitor billing.

**Stack**: React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui (Radix) +
Zustand + React Hook Form + Zod + Recharts.

---

## Quick start

```bash
# install deps
npm install

# start dev server (http://localhost:5173)
npm run dev

# type-check + production build
npm run build

# lint
npm run lint
```

Open the app at `http://localhost:5173/`. All data is mock — no backend required.

---

## Project structure

```
src/
├── components/
│   ├── layout/        # AppShell, Sidebar, Topbar, PageHeader
│   └── ui/            # shadcn primitives (button, card, table, dialog, …)
├── features/
│   ├── dashboard/     # KPI cards, charts, fee notifications
│   ├── finance/       # Finance module (page, sheets, model, CSV export)
│   ├── hostels/       # Hostels & Rooms (cards, sheets, forms)
│   ├── nomads/        # (was students/) — directory keeps the original name for git history
│   ├── guests/        # (was visitors/) — same reason
│   ├── reports/       # Reports workspace (KPI tiles, tables)
│   └── settings/      # Settings sections
├── lib/               # utils, schemas, mock data
├── pages/             # Route-level components
├── stores/            # Zustand stores (dataStore, uiStore)
└── types/             # Shared TypeScript types
```

> The directory names `students/` and `visitors/` are kept for git-history reasons.
> The user-facing labels are **Nomads** and **Guests**. Route paths are also kept
> (`/students`, `/visitors`) so existing links don't break.

---

## Branch workflow — **important**

This project uses a **single feature branch** model. The default rule:

1. **Create a NEW feature branch** — do **NOT** commit to `main`.
   - Branches follow `feature/<short>`, `fix/<short>`, `chore/<short>`.
2. **Push the feature branch** to GitHub (`origin`), **not main**.
3. **Wait for explicit user instruction** "deploy to main" / "merge to main"
   before merging. Default behavior is to leave work on the feature branch.
4. **Verify in production** via `https://<id>.space.minimax.io` (hosted deploys)
   before declaring a feature complete.

The current working branch is `feature/finance-section`. All recent work
(Finance module, Nomads/Guests rebrand, hostel rename A/C/D, Payment QR settings)
lives there.

---

## Mock data

All data lives in `src/lib/mock/data.ts` (in memory, refreshed on page reload).
Three hostels (A, C, D), all at "G-12 near SLS School"; 18+ nomads with codes
`NOM-####`; guests of various kinds (linked to nomads, independent walk-ins).

To reset to fresh mock data: refresh the browser.

---

## Deploy

Production deploys go through the `website_deploy` tool:

```bash
# Build first (tsc + vite build)
npm run build

# Then call the deploy tool with path = ./dist
# (handled outside this README — see internal docs)
```

The build output goes to `dist/` (gitignored).

---

## Conventions

- **Reuse existing primitives** — when adding UI, prefer existing
  shadcn components in `src/components/ui/`. Don't pull in new libraries.
- **Frontend-only** — no backend code. Mock data via Zustand.
- **No new icons libraries** — use `lucide-react` (already a dependency).
- **No gradients / glassmorphism / giant type / decorative illustrations**.
- **Additive changes** — preserve existing UI, navigation, workflows.
- **Plan before implementing** for any non-trivial change (> ~30 lines).
- **Verify before claiming done** — `tsc --noEmit`, `vite build`, and (since
  2026-09) **Playwright headless check** of the affected route.

---

## Cursor / AI rules

A `.cursorrules` file at the project root encodes the conventions above for any
AI assistant (Cursor, Claude, Copilot, etc.) editing the project. Read it
before making changes.

---

## Internal docs

- `docs/architecture.md` — module map, data flow, key patterns
- `docs/workflow.md` — git workflow + deploy flow in detail
- `docs/changelog.md` — major features shipped (from git history)
