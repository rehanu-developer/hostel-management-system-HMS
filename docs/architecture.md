# Architecture

## Stack
- **React 19 + Vite + TypeScript** — single-page app, client-side routing via React Router 7.
- **Tailwind v4** — utility CSS, configured via the Vite plugin (no PostCSS config file).
- **shadcn/ui** — UI primitives built on **Radix UI**. Located in `src/components/ui/`.
- **Zustand** — state management. Two stores:
  - `dataStore` (mock hostel/nomad/guest/payment data + actions)
  - `uiStore` (sidebar open/closed, etc.)
- **React Hook Form + Zod** — every form. Validation via `zodResolver`.
- **Recharts** — dashboard charts (financial, vacant-by-hostel).
- **Sonner** — toasts.
- **date-fns** — date math.
- **lucide-react** — icons (only icon library in use).
- **jsPDF + xlsx** — report exports.

## Module map

```
/                         → Dashboard (KPIs + charts + fee notifications)
/nomads                   → Nomads page (CRUD table + bulk export)
/nomads/:id               → Nomad profile (tabs: Profile, Hostel, History, Payments)
/hostels                  → Hostels list (cards)
/hostels/:id              → Hostel detail (rooms table + actions)
/guests                   → Guests page (CRUD + status/payment dropdowns)
/finance                  → Finance page (KPIs + filterable table + CSV export + pagination)
/reports                  → Reports workspace (tabs: Overview · Occupancy · Nomads · Guests)
/settings                 → Settings (General · Hostel · Fee · Preferences · Data · Payment QR)
```

## Data flow

```
mock data (data.ts) ──► Zustand dataStore ──► feature components ──► UI
                                  ▲
                          user actions (CRUD sheets)
```

The store is single-source-of-truth for all entities. Sheets (Add/Edit/Delete)
call store actions and the UI reactively updates.

## Key patterns

### Sheet-based CRUD
Most "add / edit / edit-a-detail" flows use a `Sheet` component:
- `AddNomadSheet`, `EditNomadSheet`, `DeleteNomadDialog`
- `AssignNomadSheet` (assign nomad to room)
- `ChangeRoomSheet` (move nomad to another room)
- `AddGuestSheet`, `GuestDetailSheet`
- `RecordPaymentSheet`, `PaymentDetailSheet`, `NomadFinanceSheet`
- `HostelSheet`, `RoomSheet`, `RoomDetailSheet`

Sheets use `useSheetCloseGuard` to warn about unsaved changes before close.

### Form primitives
- `useForm` from react-hook-form + `zodResolver(schema)`
- `<Form>`, `<FormField>`, `<FormItem>`, `<FormLabel>` (props: `required`, `optional`),
  `<FormControl>`, `<FormMessage>`, `<FormDescription>` (from shadcn)
- `isSubmitting` state on Button shows spinner
- Async submit handler with a 350ms delay so the spinner is perceptible

### Status dropdowns
Status badges in tables are clickable dropdowns:
- `StatusDropdown` in Nomads table (Active / Suspended / Left)
- `GuestStatusDropdown` and `GuestPaymentDropdown` in Guests table
- Clicking opens a Radix DropdownMenu, sets the new value via the store, toast confirms.

### Pagination
Finance table uses 10/page with prev/next + "1 / 5" indicator. Page resets
to 1 when filters change. `pageRows = rows.slice((page-1)*10, page*10)`.

### CSV export
Local helper in each page that needs export (Nomads, Finance). Uses
`Blob` + `URL.createObjectURL` + temporary anchor + `URL.revokeObjectURL`.
RFC 4180 quote/comma escaping. Toast confirms.

### Per-assignment pricing
`RoomHistoryEntry.agreedMonthlyPrice?: number` is the source of truth.
`resolveAgreedMonthlyPrice(nomad, openHistory, rooms)` helper computes it.
Assign + change-room sheets pre-fill the input with `targetRoom.monthlyPrice`,
admin can edit. Stored on the assignment; historical fees stay frozen.

### Independent guests
`Visitor.studentId?` is optional. `Visitor.hostelId` always required. Kind
badge ("Linked" / "Independent") shown in Guests table. Independent guests
are excluded from nomad finance roll-ups.

## Persistent bugs avoided

### Temporal Dead Zone (TDZ)
React wires up `useEffect` synchronously during render. Reading a `const`
declared later in the component throws `Cannot access 'X' before initialization`
and takes the whole tree down (blank page). Hit twice in this project
(FinancePage + ChangeRoomSheet). Rule: declare first, use second.

## Things to be careful with

1. **GitHub proxy CA cert** — the sandbox's git access breaks every few
   hours when the proxy cert expires. Fix:
   ```bash
   echo | openssl s_client -showcerts -servername github.com -connect github.com:443 2>/dev/null \
     | openssl x509 -outform PEM > /usr/local/share/ca-certificates/github-proxy.crt
   update-ca-certificates
   ```
2. **HTTP 200 ≠ page renders** — always Playwright-check a JS-driven SPA.
3. **Vite dev server is process-per-session** — use `setsid -f` or
   `nohup ... &` so it survives the bash exit.
