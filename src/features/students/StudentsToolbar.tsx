import { Search, SlidersHorizontal, X } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import type { Hostel, Room } from "@/types"

export interface StudentsFilters {
  search: string
  status: string
  hostelId: string
  roomId: string
  checkInFrom: string
  paymentStatus: string
  balance: string
  month: string
}

export const EMPTY_FILTERS: StudentsFilters = {
  search: "",
  status: "all",
  hostelId: "all",
  roomId: "all",
  checkInFrom: "",
  paymentStatus: "all",
  balance: "all",
  month: "all",
}

interface StudentsToolbarProps {
  filters: StudentsFilters
  onChange: (next: StudentsFilters) => void
  hostels: Hostel[]
  rooms: Room[]
  months: string[]
  onClear: () => void
}

export function StudentsToolbar({
  filters,
  onChange,
  hostels,
  rooms,
  months,
  onClear,
}: StudentsToolbarProps) {
  const update = <K extends keyof StudentsFilters>(
    key: K,
    value: StudentsFilters[K],
  ) => onChange({ ...filters, [key]: value })

  const advancedCount =
    (filters.roomId !== "all" ? 1 : 0) +
    (filters.checkInFrom ? 1 : 0) +
    (filters.paymentStatus !== "all" ? 1 : 0) +
    (filters.balance !== "all" ? 1 : 0) +
    (filters.month !== "all" ? 1 : 0)
  const hasActiveAdvanced = advancedCount > 0

  const hostelRooms = rooms.filter((r) =>
    filters.hostelId === "all" ? true : r.hostelId === filters.hostelId,
  )

  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "all" ||
    filters.hostelId !== "all" ||
    hasActiveAdvanced

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
      {/* Search */}
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Search students..."
          value={filters.search}
          onChange={(e) => update("search", e.target.value)}
          className="h-9 pl-8"
          aria-label="Search students"
        />
      </div>

      {/* Status filter */}
      <Select
        value={filters.status}
        onValueChange={(v) => update("status", v)}
      >
        <SelectTrigger className="h-9 w-full sm:w-[150px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="Active">Active</SelectItem>
          <SelectItem value="Left">Left</SelectItem>
          <SelectItem value="Suspended">Suspended</SelectItem>
        </SelectContent>
      </Select>

      {/* Hostel filter */}
      <Select
        value={filters.hostelId}
        onValueChange={(v) =>
          onChange({ ...filters, hostelId: v, roomId: "all" })
        }
      >
        <SelectTrigger className="h-9 w-full sm:w-[170px]">
          <SelectValue placeholder="All hostels" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All hostels</SelectItem>
          {hostels.map((h) => (
            <SelectItem key={h.id} value={h.id}>
              {h.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* More filters popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="default"
            className="h-9 gap-2"
            aria-label="More filters"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>More Filters</span>
            {hasActiveAdvanced && (
              <span className="ml-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[10px] font-medium text-[var(--primary-foreground)]">
                {advancedCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="filter-room">Room</Label>
              <Select
                value={filters.roomId}
                onValueChange={(v) => update("roomId", v)}
              >
                <SelectTrigger id="filter-room" className="h-9">
                  <SelectValue placeholder="Any room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any room</SelectItem>
                  {hostelRooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      Room {r.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filter-checkin">Check-in from</Label>
              <Input
                id="filter-checkin"
                type="date"
                value={filters.checkInFrom}
                onChange={(e) => update("checkInFrom", e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filter-payment">Payment status</Label>
              <Select
                value={filters.paymentStatus}
                onValueChange={(v) => update("paymentStatus", v)}
              >
                <SelectTrigger id="filter-payment" className="h-9">
                  <SelectValue placeholder="Any status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any status</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  <SelectItem value="Outstanding">Outstanding</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filter-balance">Balance</Label>
              <Select
                value={filters.balance}
                onValueChange={(v) => update("balance", v)}
              >
                <SelectTrigger id="filter-balance" className="h-9">
                  <SelectValue placeholder="All balances" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All balances</SelectItem>
                  <SelectItem value="outstanding">Has outstanding balance</SelectItem>
                  <SelectItem value="paid">Fully paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {months.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="filter-month">Billing month</Label>
                <Select
                  value={filters.month ?? "all"}
                  onValueChange={(v) => update("month", v as StudentsFilters["month"])}
                >
                  <SelectTrigger id="filter-month" className="h-9">
                    <SelectValue placeholder="All months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All months</SelectItem>
                    {months.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-9 px-2 text-[var(--muted-foreground)]"
        >
          <X className="h-3.5 w-3.5" />
          Clear filters
        </Button>
      )}
    </div>
  )
}
