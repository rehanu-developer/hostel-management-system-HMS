import {
  Card,
  CardContent,
} from "@/components/ui/card"

interface KpiTileProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  sub: string
  accent?: "success" | "warning" | "destructive"
}

export function KpiTile({ icon: Icon, label, value, sub, accent }: KpiTileProps) {
  const valueClass = (() => {
    if (accent === "success") return "text-[var(--success-soft-foreground)]"
    if (accent === "warning") return "text-amber-600 dark:text-amber-400"
    if (accent === "destructive")
      return "text-[var(--destructive-soft-foreground)]"
    return ""
  })()

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
              {label}
            </p>
            <p
              className={
                "mt-1 font-display text-xl font-semibold tabular-nums " +
                valueClass
              }
            >
              {value}{" "}
              <span className="text-xs font-normal text-[var(--muted-foreground)]">
                {sub}
              </span>
            </p>
          </div>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--muted)] text-[var(--muted-foreground)]">
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
