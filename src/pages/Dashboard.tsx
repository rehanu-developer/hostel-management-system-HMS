import { useMemo } from "react"
import { Users, DoorOpen, BedDouble, Wallet } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { KpiCard } from "@/features/dashboard/KpiCard"
import { FinancialChart } from "@/features/dashboard/FinancialChart"
import { FeeNotifications, type FeeNotification } from "@/features/dashboard/FeeNotifications"
import { VacantByHostel } from "@/features/dashboard/VacantByHostel"
import {
  useDataStore,
  getOccupancyByHostel,
} from "@/stores/dataStore"
import { currentMonthKey, formatCurrency } from "@/lib/utils"

export function Dashboard() {
  const students = useDataStore((s) => s.students)
  const hostels = useDataStore((s) => s.hostels)
  const rooms = useDataStore((s) => s.rooms)
  const payments = useDataStore((s) => s.payments)
  const settings = useDataStore((s) => s.settings)

  const month = currentMonthKey()

  // ---- KPIs ----
  const kpis = useMemo(() => {
    const activeStudents = students.filter((s) => s.status === "Active")
    const totalBeds = rooms.reduce((sum, r) => sum + r.capacity, 0)
    const occupiedBeds = activeStudents.length

    const currentMonthPayments = payments.filter((p) => p.month === month)
    const pendingAmount = currentMonthPayments
      .filter((p) => p.status === "Pending" || p.status === "Outstanding")
      .reduce((sum, p) => sum + p.amount, 0)

    const occupiedRooms = new Set(
      activeStudents.map((s) => s.roomId),
    ).size
    const vacantRooms = rooms.length - occupiedRooms

    return {
      totalStudents: students.length,
      activeStudents: activeStudents.length,
      vacantRooms,
      vacantBeds: totalBeds - occupiedBeds,
      pendingAmount,
      pendingCount: currentMonthPayments.filter(
        (p) => p.status === "Pending" || p.status === "Outstanding",
      ).length,
      currentCollected: currentMonthPayments
        .filter((p) => p.status === "Paid")
        .reduce((sum, p) => sum + p.amount, 0),
    }
  }, [students, rooms, payments, month])

  // ---- Financial chart data: last 6 months ----
  const chartData = useMemo(() => {
    const map = new Map<
      string,
      { month: string; collected: number; pending: number }
    >()
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      map.set(key, { month: key, collected: 0, pending: 0 })
    }
    for (const p of payments) {
      const entry = map.get(p.month)
      if (!entry) continue
      if (p.status === "Paid") entry.collected += p.amount
      else entry.pending += p.amount
    }
    return Array.from(map.values())
  }, [payments])

  // ---- Fee notifications: current month unpaid ----
  const feeNotifications: FeeNotification[] = useMemo(() => {
    return payments
      .filter(
        (p) =>
          p.month === month &&
          (p.status === "Pending" || p.status === "Outstanding"),
      )
      .map((p) => ({
        id: p.id,
        studentId: p.studentId,
        studentName: students.find((s) => s.id === p.studentId)?.name ?? "Unknown",
        month: p.month,
        amount: p.amount,
        status: p.status as "Pending" | "Outstanding",
      }))
      .sort((a, b) => (a.status === "Outstanding" ? -1 : 1))
  }, [payments, students, month])

  // ---- Vacant spaces by hostel ----
  const occupancy = useMemo(
    () => getOccupancyByHostel(hostels, rooms, students),
    [hostels, rooms, students],
  )

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome back. Here's the state of ${settings.systemName.toLowerCase()} today.`}
      />

      <div className="space-y-6 p-4 lg:p-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Total Students"
            value={kpis.totalStudents}
            icon={Users}
            hint={`${kpis.activeStudents} active · ${students.filter((s) => s.status === "Suspended").length} suspended · ${students.filter((s) => s.status === "Left").length} left`}
          />
          <KpiCard
            label="Vacant Rooms"
            value={kpis.vacantRooms}
            icon={DoorOpen}
            hint={`Out of ${rooms.length} total rooms`}
          />
          <KpiCard
            label="Vacant Beds"
            value={kpis.vacantBeds}
            icon={BedDouble}
            hint="Across all hostels"
          />
          <KpiCard
            label="Pending Fees"
            value={formatCurrency(kpis.pendingAmount, settings.currency)}
            icon={Wallet}
            accent={kpis.pendingAmount > 0 ? "warning" : "success"}
            hint={`${kpis.pendingCount} ${kpis.pendingCount === 1 ? "student" : "students"} pending`}
          />
        </div>

        {/* Main two-column area */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 space-y-6">
            <FinancialChart data={chartData} />
            <FeeNotifications items={feeNotifications} />
          </div>
          <div className="space-y-6">
            <VacantByHostel data={occupancy} />
            <QuickStats
              collected={kpis.currentCollected}
              pending={kpis.pendingAmount}
              currency={settings.currency}
            />
          </div>
        </div>
      </div>
    </>
  )
}

function QuickStats({
  collected,
  pending,
  currency,
}: {
  collected: number
  pending: number
  currency: string
}) {
  const total = collected + pending
  const pct = total === 0 ? 0 : Math.round((collected / total) * 100)
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
      <p className="font-display text-base font-semibold">This Month</p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
        Collection progress
      </p>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-display text-2xl font-semibold">
          {formatCurrency(collected, currency)}
        </span>
        <span className="text-sm text-[var(--muted-foreground)]">
          of {formatCurrency(total, currency)}
        </span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
        <div
          className="h-full rounded-full bg-[var(--success)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
        {pct}% collected · {formatCurrency(pending, currency)} remaining
      </p>
    </div>
  )
}
