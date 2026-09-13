import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-[var(--border)] px-4 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-6",
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
