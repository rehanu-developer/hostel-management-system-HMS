import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Users,
  BedDouble,
  DoorOpen,
  Wallet,
  UserCheck,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useDataStore, getHostelStats } from "@/stores/dataStore"
import { formatCurrency } from "@/lib/utils"
import { currentMonthKey } from "@/lib/utils"

export function OverviewReport() {
  const hostels = useDataStore((s) => s.hostels)
  const rooms = useDataStore((s) => s.rooms)
  const students = useDataStore((s) => s.students)
  const payments = useDataStore((s) => s.payments)
  const visitors = useDataStore((s) => s.visitors)
  const currency = useDataStore((s) => s.settings.currency)
  const navigate = useNavigate()

  const stats = useMemo(() => {
    const activeStudents = students.filter((s) => s.status === "Active")
    const totalBeds = rooms.reduce((sum, r) => sum + r.capacity, 0)
    const occupiedBeds = activeStudents.length
    const occupiedRoomIds = new Set(activeStudents.map((s) => s.roomId))
    const occupiedRooms = occupiedRoomIds.size
    const vacantRooms = rooms.length - occupiedRooms

    const month = currentMonthKey()
    const monthPayments = payments.filter((p) => p.month === month)
    const collected = monthPayments
      .filter((p) => p.status === "Paid")
      .reduce((sum, p) => sum + p.amount, 0)
    const pending = monthPayments
      .filter((p) => p.status === "Pending" || p.status === "Outstanding" || p.status === "Partially Paid")
      .reduce((sum, p) => sum + p.amount, 0)

    const activeVisitors = visitors.filter((v) => !v.actualCheckOut)

    return {
      totalStudents: students.length,
      activeStudents: activeStudents.length,
      totalBeds,
      occupiedBeds,
      vacantBeds: totalBeds - occupiedBeds,
      occupiedRooms,
      vacantRooms,
      occupancyPercent: totalBeds === 0 ? 0 : Math.round((occupiedBeds / totalBeds) * 100),
      collected,
      pending,
      pendingCount: monthPayments.filter(
        (p) => p.status === "Pending" || p.status === "Outstanding" || p.status === "Partially Paid",
      ).length,
      activeVisitors: activeVisitors.length,
      totalVisitors: visitors.length,
    }
  }, [students, rooms, payments, visitors])

  const hostelSummary = useMemo(
    () => hostels.map((h) => getHostelStats(h, rooms, students)),
    [hostels, rooms, students],
  )

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <SummaryStat
          label="Total Students"
          value={stats.totalStudents}
          sub="enrolled"
          hint={`${stats.activeStudents} active`}
          icon={Users}
        />
        <SummaryStat
          label="Occupied Beds"
          value={stats.occupiedBeds}
          sub={`of ${stats.totalBeds}`}
          hint={`${stats.occupancyPercent}% occupancy`}
          icon={BedDouble}
        />
        <SummaryStat
          label="Vacant Beds"
          value={stats.vacantBeds}
          sub="available"
          hint={`${stats.vacantRooms} vacant rooms`}
          icon={BedDouble}
          accent="success"
        />
        <SummaryStat
          label="Rooms"
          value={`${stats.occupiedRooms}/${rooms.length}`}
          sub="occupied"
          icon={DoorOpen}
        />
        <SummaryStat
          label="This Month"
          value={formatCurrency(stats.collected, currency)}
          sub="collected"
          hint={`${formatCurrency(stats.pending, currency)} pending`}
          icon={Wallet}
        />
        <SummaryStat
          label="Active Visitors"
          value={stats.activeVisitors}
          sub="checked in"
          hint={`${stats.totalVisitors} total records`}
          icon={UserCheck}
        />
      </div>

      {/* Hostel summary list */}
      <Card>
        <CardHeader>
          <CardTitle>Hostels at a glance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {hostelSummary.map((h) => (
              <button
                key={h.hostel.id}
                onClick={() => navigate(`/hostels/${h.hostel.id}`)}
                className="flex w-full items-center justify-between gap-4 rounded-md border border-[var(--border)] px-4 py-3 text-left transition-colors hover:bg-[var(--accent)]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{h.hostel.name}</p>
                    <Badge variant={h.hostel.status === "Active" ? "success-soft" : "neutral-soft"}>
                      {h.hostel.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                    {h.hostel.location}
                  </p>
                </div>
                <div className="flex items-center gap-6 text-xs">
                  <div className="text-right">
                    <p className="text-[var(--muted-foreground)]">Rooms</p>
                    <p className="font-medium tabular-nums">
                      {h.occupiedRooms}/{h.totalRooms}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[var(--muted-foreground)]">Beds</p>
                    <p className="font-medium tabular-nums">
                      {h.occupiedBeds}/{h.totalBeds}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[var(--muted-foreground)]">Occupancy</p>
                    <p className="font-medium tabular-nums">
                      {h.occupancyPercent}%
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryStat({
  label,
  value,
  sub,
  hint,
  icon: Icon,
  accent,
}: {
  label: string
  value: string | number
  sub: string
  hint?: string
  icon: React.ComponentType<{ className?: string }>
  accent?: "success"
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
              {label}
            </p>
            <p className="mt-1 font-display text-xl font-semibold tabular-nums">
              {value}{" "}
              <span className="text-xs font-normal text-[var(--muted-foreground)]">
                {sub}
              </span>
            </p>
            {hint && (
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {hint}
              </p>
            )}
          </div>
          <div
            className={
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md " +
              (accent === "success"
                ? "bg-[var(--success-soft)] text-[var(--success-soft-foreground)]"
                : "bg-[var(--muted)] text-[var(--muted-foreground)]")
            }
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function OverviewReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-6 w-20" />
              <Skeleton className="mt-2 h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  )
}
