import { ReactNode } from "react"
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
import { cn } from "@/lib/utils"

interface ReportFiltersBarProps {
  search?: {
    value: string
    onChange: (v: string) => void
    placeholder?: string
  }
  selects?: Array<{
    value: string
    onChange: (v: string) => void
    placeholder?: string
    options: Array<{ value: string; label: string }>
    width?: string
  }>
  custom?: ReactNode
  onClear?: () => void
  hasActiveFilters?: boolean
  className?: string
}

export function ReportFiltersBar({
  search,
  selects = [],
  custom,
  onClear,
  hasActiveFilters,
  className,
}: ReportFiltersBarProps) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2", className)}>
      {search && (
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            placeholder={search.placeholder ?? "Search..."}
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            className="h-9 pl-8"
            aria-label="Search"
          />
        </div>
      )}

      {selects.map((s, i) => (
        <Select key={i} value={s.value} onValueChange={s.onChange}>
          <SelectTrigger
            className={cn("h-9 w-full", s.width ?? "sm:w-[160px]")}
          >
            <SelectValue placeholder={s.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {s.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {custom}

      {onClear && hasActiveFilters && (
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
