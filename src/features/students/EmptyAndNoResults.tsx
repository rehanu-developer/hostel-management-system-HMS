import { Plus, SearchX, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  onAdd: () => void
}

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-[var(--border)] bg-[var(--card)] py-16 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
        <Users className="h-4 w-4" />
      </div>
      <h3 className="mt-4 font-display text-base font-semibold">
        No students yet
      </h3>
      <p className="mt-1 max-w-sm text-sm text-[var(--muted-foreground)]">
        Add your first student to start managing hostel accommodation and
        payments.
      </p>
      <Button onClick={onAdd} className="mt-4">
        <Plus className="h-3.5 w-3.5" />
        Add Student
      </Button>
    </div>
  )
}

interface NoResultsStateProps {
  onClear: () => void
}

export function NoResultsState({ onClear }: NoResultsStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-[var(--border)] bg-[var(--card)] py-14 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
        <SearchX className="h-4 w-4" />
      </div>
      <h3 className="mt-4 font-display text-base font-semibold">
        No students found
      </h3>
      <p className="mt-1 max-w-sm text-sm text-[var(--muted-foreground)]">
        Try changing your search or filters.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onClear}
        className="mt-4"
      >
        Clear filters
      </Button>
    </div>
  )
}
