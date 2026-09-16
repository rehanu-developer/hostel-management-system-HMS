# Changelog

Major features / refactors shipped to `feature/finance-section`. (See
`git log --oneline feature/finance-section` for the canonical list.)

## Phase 1 — Foundational shell
- Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui scaffold
- AppShell (sidebar + topbar + page header)
- Mock data + Zustand store
- Dashboard with KPIs and basic charts
- Oxlint config

## Phase 2 — Domain pages
- Nomads page: CRUD table, add/edit sheets, status dropdown, delete
- Hostels & Rooms: hostel cards, detail page, room sheets, assign/change-room
- Reports workspace: Overview / Occupancy / Nomads / Visitors / Financial
  tabs, with date-range filters + Excel/PDF export
- Settings: 5 sections (General, Hostel, Fee, Preferences, Data)

## Phase 3 — UX hardening
- Button `isSubmitting` state for perceptible spinners
- FormLabel `required` / `optional` props
- SheetCloseGuard for unsaved-changes warning
- TooltipProvider in the AppShell root
- FeeNotifications on the dashboard
- Status dropdowns on nomads (inline status change)

## Phase 4 — HMS Finance module (initial)
- New `features/finance/` directory
- `FinancePage` with 4 KPI summary cards (Total Collected, Outstanding,
  Pending Students, Expected Revenue)
- Filter bar: search, hostel, payment type, status, billing month, date range
- `RecordPaymentSheet` (type-aware for Student/Visitor)
- `PaymentDetailSheet` with breakdown + inline record-payment
- `NomadFinanceSheet` (accommodation + guest payments + payment history)
- Per-month fee record with `paid` field (running paid total)
- New store actions: `recordStudentPayment`, `recordVisitorPaymentAmount`
- Sidebar nav: added Visitors + Finance

## Phase 5 — Per-assignment pricing + Independent guests
- `RoomHistoryEntry.agreedMonthlyPrice?` for negotiated price per assignment
- `VisitorKind = "linked" | "independent"`; `Visitor.studentId?` optional
- `resolveAgreedMonthlyPrice(nomad, openHistory, rooms)` helper
- `AssignNomadSheet` + `ChangeRoomSheet` show "Agreed Monthly Price" input
  pre-filled from room default, editable
- `AddGuestSheet` has Linked/Independent toggle
- Finance table + sheets handle both kinds
- 3 independent walk-in guests in mock data

## Phase 6 — Audit fixes
- `Payment.paid` semantics fix (Paid = full amount, Partially Paid = paid
  amount; previously inconsistent)
- `ensureCurrentMonthFee` only updates amount when `paid === 0` (preserves
  historical frozen fees when room price changes)
- FinancialReport independent-guest handling fix
- Dashboard / StudentProfile Partially Paid math fix

## Phase 7 — Status dropdown + Multiple guardians
- Inline status dropdown on nomad rows + guest rows
- Delete button on StudentProfile → DeleteStudentDialog
- `Student.familyMember` (single) → `Student.guardians: FamilyMember[]`
  (array via `useFieldArray`)

## Phase 8 — Nomads dashboard cleanup
- Removed row click → `/nomads/:id` (no Person Portal)
- Inline StatusDropdown on status badge
- RowActionsMenu replaced with horizontal icon row (32→28px circular icons)

## Phase 9 — Finance table polish + Export
- Trimmed columns (removed Description, Amount, Paid, Remaining, Last Payment)
- Horizontal icon row for finance actions
- Export button + page header integration
- Bulk selection + Export selected on Nomads page

## Phase 10 — Table layout fixes
- Students table: cramped icons → h-7 w-7 + gap-1, Actions column widened
  to 176px, Hostel column narrowed to 140px with truncate
- Finance table: same icon fix + pagination (10/page)
- Visitors table: status + payment dropdowns, payment filter
- Students table: removed Check-in column

## Phase 11 — Students form hierarchy
- Wrapped each section (Personal / Hostel / Status) in a card
- Bigger section headings (`font-display text-base font-semibold`)
- Removed unused FormLabel import

## Phase 12 — Price default pre-fill
- Agreed Monthly Price input now pre-fills from `room.monthlyPrice`
  whenever a room is selected; admin can still edit
- Both AssignNomadSheet and ChangeRoomSheet

## Phase 13 — Reports KPI cards
- Lifted `KpiTile` into `reports/KpiTile.tsx`
- Added 3 KPI cards each to Students + Visitors reports
- Removed Financial tab from Reports (Finance has its own page)

## Phase 14 — Rebrand to Nomads Boys Hostel
- UI text: Student → Nomad, Visitor → Guest (file/identifier names kept)
- Hostels renamed to A, C, D (dropped 4th); all at "G-12 near SLS School"
- Nomad codes STU-#### → NOM-####
- Sidebar: Students → Nomads, Visitors → Guests

## Phase 15 — Branding
- Custom favicon (`public/nomads-favicon.svg`) — round house logo
- Sidebar header: round logo + "NOMADS / BOYS HOSTEL" two-line title
- Browser tab title → "Nomads Boys Hostel — Manager"

## Phase 16 — TDZ bug fixes (CRITICAL)
- FinancePage: pagination state referenced `rows` before declaration
- ChangeRoomSheet: pre-fill effect referenced `targetRoom` before declaration
- Both caused blank pages with `Cannot access 'X' before initialization`
- Caught and verified with Playwright headless

## Phase 17 — Settings → Payment QR
- New "Payment QR" section in Settings (6th tab)
- Pill tabs for Easypaisa / HBL / JazzCash
- Hand-rolled deterministic dummy QR SVG (no new dependency)
- Account details + Payment URL + Copy URL button
- SettingsNav + mobile Select updated

## Verification tooling
- Installed Playwright globally (in workspace, not in project)
- `/tmp/check-finance.js`, `/tmp/check-hostels.js`, etc. for headless smoke tests
- Pattern: navigate → wait for networkidle → check for `pageerror` → assert
  body innerText contains expected strings.
