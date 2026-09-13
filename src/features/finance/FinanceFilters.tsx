import { Calendar, Filter, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComp } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import type { Hostel } from "@/types"
import {
  EMPTY_FINANCE_FILTERS,
  isFinanceFilterActive,
  type FinanceFilters,
} from "./financeModel"

interface Props {
  filters: FinanceFilters
  onChange: (next: FinanceFilters) => void
  hostels: Hostel[]
  months: string[]
  onClear: () => void
}

export function FinanceFilters({ filters, onChange, hostels, months, onClear }: Props) {
  const set = (patch: Partial<FinanceFilters>) => onChange({ ...filters, ...patch })
  const active = isFinanceFilterActive(filters)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            placeholder="Search nomad, ID, phone, guest…"
            className="pl-9"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
          />
        </div>

        <Select
          value={filters.hostelId}
          onValueChange={(v) => set({ hostelId: v })}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Hostel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Hostels</SelectItem>
            {hostels.map((h) => (
              <SelectItem key={h.id} value={h.id}>
                {h.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.type} onValueChange={(v) => set({ type: v as FinanceFilters["type"] })}>
          <SelectTrigger className="w-full sm:w-[170px]">
            <SelectValue placeholder="Payment Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payment Types</SelectItem>
            <SelectItem value="accommodation">Nomad Accommodation</SelectItem>
            <SelectItem value="visitor">Guest Stay</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={(v) => set({ status: v as FinanceFilters["status"] })}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Partially Paid">Partially Paid</SelectItem>
            <SelectItem value="Outstanding">Outstanding</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.month} onValueChange={(v) => set({ month: v })}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Billing Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {months.map((m) => (
              <SelectItem key={m} value={m}>
                {formatMonthKey(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Date Range
              {(filters.rangeFrom || filters.rangeTo) && (
                <Badge variant="secondary" className="ml-1">
                  {filters.rangeFrom && filters.rangeTo
                    ? `${shortDate(filters.rangeFrom)} – ${shortDate(filters.rangeTo)}`
                    : filters.rangeFrom
                      ? `From ${shortDate(filters.rangeFrom)}`
                      : `Until ${shortDate(filters.rangeTo)}`}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-3">
            <div className="grid gap-2">
              <div className="text-xs font-medium text-[var(--muted-foreground)]">
                Filter by payment date
              </div>
              <div className="flex items-center gap-2">
                <DateField
                  label="From"
                  value={filters.rangeFrom}
                  onChange={(v) => set({ rangeFrom: v })}
                />
                <DateField
                  label="To"
                  value={filters.rangeTo}
                  onChange={(v) => set({ rangeTo: v })}
                />
              </div>
              {(filters.rangeFrom || filters.rangeTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-end"
                  onClick={() => set({ rangeFrom: "", rangeTo: "" })}
                >
                  Clear Range
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {active && (
          <Button variant="ghost" size="sm" className="text-[var(--muted-foreground)]" onClick={onClear}>
            <X className="h-3.5 w-3.5" />
            Clear Filters
          </Button>
        )}
      </div>

      {active && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="h-3 w-3 text-[var(--muted-foreground)]" />
          {filters.hostelId !== "all" && (
            <ActiveBadge
              label={`Hostel: ${hostels.find((h) => h.id === filters.hostelId)?.name ?? "—"}`}
              onRemove={() => set({ hostelId: "all" })}
            />
          )}
          {filters.type !== "all" && (
            <ActiveBadge
              label={`Type: ${filters.type === "accommodation" ? "Accommodation" : "Guest Stay"}`}
              onRemove={() => set({ type: "all" })}
            />
          )}
          {filters.status !== "all" && (
            <ActiveBadge
              label={`Status: ${filters.status}`}
              onRemove={() => set({ status: "all" })}
            />
          )}
          {filters.month !== "all" && (
            <ActiveBadge
              label={`Month: ${formatMonthKey(filters.month)}`}
              onRemove={() => set({ month: "all" })}
            />
          )}
        </div>
      )}
    </div>
  )
}

function ActiveBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge variant="neutral-soft" className="gap-1 pr-1">
      {label}
      <button
        type="button"
        aria-label={`Remove ${label}`}
        onClick={onRemove}
        className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </Badge>
  )
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col">
      <span className="mb-1 text-[11px] font-medium text-[var(--muted-foreground)]">
        {label}
      </span>
      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-[150px]"
      />
    </div>
  )
}

function shortDate(iso: string) {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function formatMonthKey(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  })
}

export { EMPTY_FINANCE_FILTERS }
