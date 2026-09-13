import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface KpiCardProps {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  trend?: {
    value: string
    direction: "up" | "down" | "neutral"
  }
  accent?: "default" | "warning" | "success"
}

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  accent = "default",
}: KpiCardProps) {
  const accentClass =
    accent === "warning"
      ? "text-[var(--warning)] bg-[var(--warning)]/10"
      : accent === "success"
        ? "text-[var(--success)] bg-[var(--success)]/10"
        : "text-[var(--primary)] bg-[var(--secondary)]"

  return (
    <Card className="border-[var(--border)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
              {label}
            </p>
            <p className="font-display text-2xl font-semibold tracking-tight">
              {value}
            </p>
            {hint && (
              <p className="text-xs text-[var(--muted-foreground)]">{hint}</p>
            )}
          </div>
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md",
              accentClass,
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1 text-xs">
            <span
              className={cn(
                "font-medium",
                trend.direction === "up" && "text-[var(--success)]",
                trend.direction === "down" && "text-[var(--destructive)]",
                trend.direction === "neutral" && "text-[var(--muted-foreground)]",
              )}
            >
              {trend.value}
            </span>
            <span className="text-[var(--muted-foreground)]">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
