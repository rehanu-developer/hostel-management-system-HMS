import {
  BanknoteArrowDown,
  BanknoteX,
  CalendarClock,
  Coins,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { FinanceSummary } from "./financeModel"
import { formatCurrency } from "@/lib/utils"

interface Props {
  summary: FinanceSummary
  currency: string
}

export function FinanceSummaryCards({ summary, currency }: Props) {
  const cards = [
    {
      key: "collected",
      label: "Total Collected",
      value: formatCurrency(summary.collected, currency),
      icon: BanknoteArrowDown,
      tone: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      key: "outstanding",
      label: "Outstanding",
      value: formatCurrency(summary.outstanding, currency),
      icon: BanknoteX,
      tone: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
    },
    {
      key: "pending",
      label: "Pending Nomads",
      value: summary.pendingStudents.toLocaleString(),
      icon: CalendarClock,
      tone: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/40",
    },
    {
      key: "expected",
      label: "Expected Revenue",
      value: formatCurrency(summary.expected, currency),
      icon: Coins,
      tone: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-950/40",
    },
  ] as const

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map(({ key, label, value, icon: Icon, tone, bg }) => (
        <Card key={key}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">
                {label}
              </span>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${bg}`}
              >
                <Icon className={`h-3.5 w-3.5 ${tone}`} />
              </span>
            </div>
            <div className="mt-2 font-display text-2xl font-semibold tabular-nums">
              {value}
            </div>
            <div className="mt-1 text-[11px] text-[var(--muted-foreground)]">
              {key === "expected"
                ? "Accommodation only · active filters"
                : key === "pending"
                  ? "Nomads with unpaid accommodation fees"
                  : key === "collected"
                    ? "Across accommodation + guest stays"
                    : "Total amount still owed"}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function FinanceSummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
