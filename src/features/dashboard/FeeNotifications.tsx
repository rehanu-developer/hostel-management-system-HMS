import { Link } from "react-router-dom"
import { ChevronRight, AlertCircle, Clock } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, formatCurrency } from "@/lib/utils"

export interface FeeNotification {
  id: string
  studentId: string
  studentName: string
  month: string
  amount: number
  status: "Pending" | "Outstanding"
}

interface FeeNotificationsProps {
  items: FeeNotification[]
}

export function FeeNotifications({ items }: FeeNotificationsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle>Fee Notifications</CardTitle>
          <CardDescription>
            {items.length === 0
              ? "All students are up to date."
              : `${items.length} unpaid ${items.length === 1 ? "record" : "records"} this month.`}
          </CardDescription>
        </div>
        <Badge variant="muted">{items.length}</Badge>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {items.map((n) => (
              <li
                key={n.id}
                className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-[var(--accent)]/40"
              >
                <StatusIcon status={n.status} />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/students/${n.studentId}`}
                    className="block truncate text-sm font-medium hover:underline"
                  >
                    {n.studentName}
                  </Link>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {monthLabel(n.month)} · {formatCurrency(n.amount)}
                  </p>
                </div>
                <Badge
                  variant={n.status === "Outstanding" ? "destructive" : "warning"}
                >
                  {n.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="h-8 w-8"
                >
                  <Link to={`/students/${n.studentId}`} aria-label="View student">
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function StatusIcon({ status }: { status: "Pending" | "Outstanding" }) {
  if (status === "Outstanding") {
    return (
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md",
          "bg-[var(--destructive)]/10 text-[var(--destructive)]",
        )}
      >
        <AlertCircle className="h-4 w-4" />
      </div>
    )
  }
  return (
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md",
        "bg-[var(--warning)]/10 text-[var(--warning)]",
      )}
    >
      <Clock className="h-4 w-4" />
    </div>
  )
}

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  })
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--success)]/10 text-[var(--success)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <p className="mt-3 text-sm font-medium">No pending fees</p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
        All collected for the current month.
      </p>
    </div>
  )
}
