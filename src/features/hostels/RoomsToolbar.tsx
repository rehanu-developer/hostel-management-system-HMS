import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface RoomsFilters {
  search: string
  status: string
  capacity: string
}

export const EMPTY_ROOMS_FILTERS: RoomsFilters = {
  search: "",
  status: "all",
  capacity: "all",
}

interface RoomsToolbarProps {
  filters: RoomsFilters
  onChange: (next: RoomsFilters) => void
  onClear: () => void
}

export function RoomsToolbar({
  filters,
  onChange,
  onClear,
}: RoomsToolbarProps) {
  const update = <K extends keyof RoomsFilters>(
    key: K,
    value: RoomsFilters[K],
  ) => onChange({ ...filters, [key]: value })

  const hasActive =
    filters.search !== "" || filters.status !== "all" || filters.capacity !== "all"

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Search rooms..."
          value={filters.search}
          onChange={(e) => update("search", e.target.value)}
          className="h-9 pl-8"
          aria-label="Search rooms"
        />
      </div>

      <Select
        value={filters.status}
        onValueChange={(v) => update("status", v)}
      >
        <SelectTrigger className="h-9 w-full sm:w-[170px]">
          <SelectValue placeholder="All rooms" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All rooms</SelectItem>
          <SelectItem value="Available">Available</SelectItem>
          <SelectItem value="Partially Occupied">Partially Occupied</SelectItem>
          <SelectItem value="Full">Full</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.capacity}
        onValueChange={(v) => update("capacity", v)}
      >
        <SelectTrigger className="h-9 w-full sm:w-[150px]">
          <SelectValue placeholder="Any capacity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any capacity</SelectItem>
          <SelectItem value="2">2 beds</SelectItem>
          <SelectItem value="3">3 beds</SelectItem>
          <SelectItem value="4">4 beds</SelectItem>
          <SelectItem value="5">5 beds</SelectItem>
        </SelectContent>
      </Select>

      {hasActive && (
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
