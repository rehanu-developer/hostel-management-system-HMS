import { SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface ReportEmptyStateProps {
  title?: string
  description?: string
  onClear?: () => void
  hasFilters?: boolean
}

export function ReportEmptyState({
  title = "No results found",
  description = "Try adjusting your filters or date range.",
  onClear,
  hasFilters,
}: ReportEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-[var(--border)] bg-[var(--card)] py-16 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
        <SearchX className="h-4 w-4" />
      </div>
      <h3 className="mt-4 font-display text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-[var(--muted-foreground)]">
        {description}
      </p>
      {onClear && hasFilters && (
        <Button variant="outline" size="sm" onClick={onClear} className="mt-4">
          Clear filters
        </Button>
      )}
    </div>
  )
}

interface ReportTableSkeletonProps {
  rows?: number
  cols?: number
}

export function ReportTableSkeleton({ rows = 6, cols = 5 }: ReportTableSkeletonProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={cn("grid gap-3")}
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: cols }).map((__, j) => (
              <Skeleton key={j} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
