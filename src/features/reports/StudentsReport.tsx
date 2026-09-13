import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, Wallet } from "lucide-react"
import { ReportFiltersBar } from "./ReportFiltersBar"
import { ReportTableSkeleton, ReportEmptyState } from "./ReportTable"
import { KpiTile } from "./KpiTile"
import { useDataStore } from "@/stores/dataStore"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { StudentStatus, PaymentStatus } from "@/types"
import type { ExportColumn } from "./export"

type SortKey = "name" | "hostel" | "checkIn" | "fee" | "status"

interface StudentsReportProps {
  onExportReady?: (payload: {
    rows: Array<{
      name: string
      studentCode: string
      hostelName: string
      roomNumber: string
      status: StudentStatus
      checkIn: string
      monthlyFee: number | null
      paymentStatus: PaymentStatus | null
    }>
    columns: ExportColumn<{
      name: string
      studentCode: string
      hostelName: string
      roomNumber: string
      status: StudentStatus
      checkIn: string
      monthlyFee: number | null
      paymentStatus: PaymentStatus | null
    }>[]
    sheetTitle: string
  }) => void
}

export function StudentsReport({ onExportReady }: StudentsReportProps = {}) {
  const hostels = useDataStore((s) => s.hostels)
  const rooms = useDataStore((s) => s.rooms)
  const students = useDataStore((s) => s.students)
  const payments = useDataStore((s) => s.payments)
  const currency = useDataStore((s) => s.settings.currency)
  const navigate = useNavigate()

  const [search, setSearch] = useState("")
  const [hostelFilter, setHostelFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("Active")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const hostelById = new Map(hostels.map((h) => [h.id, h]))
  const roomById = new Map(rooms.map((r) => [r.id, r]))

  const rows = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 0) + ""
    void currentMonth
    return students
      .filter((s) => {
        if (search) {
          const q = search.toLowerCase()
          const hay = [
            s.name,
            s.studentCode,
            s.phone,
            s.bio,
            s.referencePerson,
            hostelById.get(s.hostelId)?.name ?? "",
          ]
            .join(" ")
            .toLowerCase()
          if (!hay.includes(q)) return false
        }
        if (hostelFilter !== "all" && s.hostelId !== hostelFilter) return false
        if (statusFilter !== "all" && s.status !== statusFilter) return false
        if (fromDate && s.checkIn < fromDate) return false
        if (toDate && s.checkIn > toDate) return false
        return true
      })
      .map((s) => {
        const hostel = hostelById.get(s.hostelId)
        const room = roomById.get(s.roomId)
        // Find current month payment
        const now = new Date()
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
        const payment = payments.find(
          (p) => p.studentId === s.id && p.month === monthKey,
        )
        return {
          student: s,
          hostelName: hostel?.name ?? "—",
          roomNumber: room?.number ?? "—",
          monthlyFee: payment?.amount ?? null,
          paymentStatus: payment?.status ?? null,
        }
      })
      .sort((a, b) => {
        let cmp = 0
        if (sortKey === "name") cmp = a.student.name.localeCompare(b.student.name)
        else if (sortKey === "hostel")
          cmp = a.hostelName.localeCompare(b.hostelName)
        else if (sortKey === "checkIn")
          cmp = a.student.checkIn.localeCompare(b.student.checkIn)
        else if (sortKey === "fee") {
          const av = a.monthlyFee ?? 0
          const bv = b.monthlyFee ?? 0
          cmp = av - bv
        } else if (sortKey === "status") {
          cmp = a.student.status.localeCompare(b.student.status)
        }
        return sortDir === "asc" ? cmp : -cmp
      })
  }, [students, hostelById, roomById, payments, search, hostelFilter, statusFilter, fromDate, toDate, sortKey, sortDir])

  const hasFilters =
    search !== "" ||
    hostelFilter !== "all" ||
    statusFilter !== "all" ||
    fromDate !== "" ||
    toDate !== ""

  const kpis = useMemo(() => {
    const total = students.length
    const activeCount = students.filter((s) => s.status === "Active").length
    const inactiveCount = total - activeCount
    // Current-month payment status counts
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const currentPayments = payments.filter((p) => p.month === monthKey)
    const outstandingCount = students.filter((s) => {
      if (s.status !== "Active") return false
      const p = currentPayments.find((x) => x.studentId === s.id)
      if (!p) return true
      return p.status !== "Paid"
    }).length
    const settledCount = activeCount - outstandingCount
    return { total, activeCount, inactiveCount, outstandingCount, settledCount }
  }, [students, payments])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  useEffect(() => {
    if (!onExportReady) return
    onExportReady({
      rows: rows.map((r) => ({
        name: r.student.name,
        studentCode: r.student.studentCode,
        hostelName: r.hostelName,
        roomNumber: r.roomNumber,
        status: r.student.status,
        checkIn: r.student.checkIn,
        monthlyFee: r.monthlyFee,
        paymentStatus: r.paymentStatus,
      })),
      columns: [
        { header: "Student", accessor: (r) => r.name },
        { header: "Student ID", accessor: (r) => r.studentCode },
        { header: "Hostel", accessor: (r) => r.hostelName },
        { header: "Room", accessor: (r) => r.roomNumber },
        { header: "Status", accessor: (r) => r.status },
        { header: "Check-in", accessor: (r) => r.checkIn },
        { header: "Monthly Fee", accessor: (r) => r.monthlyFee ?? "", align: "right" },
        { header: "Payment", accessor: (r) => r.paymentStatus ?? "" },
      ],
      sheetTitle: "Students Report",
    })
  }, [rows, onExportReady])

  return (
    <div className="space-y-4">
      {/* KPI Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiTile
          icon={Users}
          label="Total Students"
          value={kpis.total}
          sub="across all hostels"
        />
        <KpiTile
          icon={UserCheck}
          label="Active"
          value={kpis.activeCount}
          sub={`${kpis.inactiveCount} inactive`}
          accent="success"
        />
        <KpiTile
          icon={Wallet}
          label="Outstanding"
          value={kpis.outstandingCount}
          sub={`${kpis.settledCount} settled`}
          accent={kpis.outstandingCount > 0 ? "warning" : undefined}
        />
      </div>

      <ReportFiltersBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search students...",
        }}
        selects={[
          {
            value: hostelFilter,
            onChange: setHostelFilter,
            placeholder: "All hostels",
            options: [
              { value: "all", label: "All hostels" },
              ...hostels.map((h) => ({ value: h.id, label: h.name })),
            ],
            width: "sm:w-[160px]",
          },
          {
            value: statusFilter,
            onChange: setStatusFilter,
            placeholder: "All statuses",
            options: [
              { value: "all", label: "All statuses" },
              { value: "Active", label: "Active" },
              { value: "Left", label: "Left" },
              { value: "Suspended", label: "Suspended" },
            ],
            width: "sm:w-[170px]",
          },
        ]}
        custom={
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 rounded-md border border-[var(--input)] bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)]"
              aria-label="Check-in from"
            />
            <span className="text-xs text-[var(--muted-foreground)]">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 rounded-md border border-[var(--input)] bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)]"
              aria-label="Check-in to"
            />
          </div>
        }
        onClear={() => {
          setSearch("")
          setHostelFilter("all")
          setStatusFilter("all")
          setFromDate("")
          setToDate("")
        }}
        hasActiveFilters={hasFilters}
      />

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <Table className="table-fixed">
          <colgroup>
            <col className="w-[200px] pl-6" />
            <col className="w-[120px]" />
            <col />
            <col className="w-[110px]" />
            <col className="w-[140px]" />
            <col className="w-[130px]" />
            <col className="w-[110px]" />
            <col className="w-[110px] pr-6" />
          </colgroup>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">
                <SortHeader label="Student" sortKey={sortKey} col="name" dir={sortDir} onSort={toggleSort} />
              </TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>
                <SortHeader label="Hostel" sortKey={sortKey} col="hostel" dir={sortDir} onSort={toggleSort} />
              </TableHead>
              <TableHead>Room</TableHead>
              <TableHead>
                <SortHeader label="Check-in" sortKey={sortKey} col="checkIn" dir={sortDir} onSort={toggleSort} />
              </TableHead>
              <TableHead>
                <SortHeader label="Status" sortKey={sortKey} col="status" dir={sortDir} onSort={toggleSort} />
              </TableHead>
              <TableHead className="text-right">
                <SortHeader label="Monthly Fee" sortKey={sortKey} col="fee" dir={sortDir} onSort={toggleSort} align="right" />
              </TableHead>
              <TableHead className="pr-6">Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="p-0">
                  <ReportEmptyState
                    onClear={() => {
                      setSearch("")
                      setHostelFilter("all")
                      setStatusFilter("all")
                      setFromDate("")
                      setToDate("")
                    }}
                    hasFilters={hasFilters}
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => {
                const statusVariant: Record<StudentStatus, "success-soft" | "neutral-soft" | "destructive-soft"> = {
                  Active: "success-soft",
                  Left: "neutral-soft",
                  Suspended: "destructive-soft",
                }
                const paymentVariant: Record<PaymentStatus, "success-soft" | "warning-soft" | "info-soft" | "destructive-soft"> = {
                  Paid: "success-soft",
                  Pending: "warning-soft",
                  "Partially Paid": "info-soft",
                  Outstanding: "destructive-soft",
                }
                return (
                  <TableRow
                    key={r.student.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/students/${r.student.id}`)}
                  >
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <span className="font-medium text-[14px]">
                          {r.student.name}
                        </span>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {r.student.bio}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[14px] text-[var(--muted-foreground)]">
                      {r.student.studentCode}
                    </TableCell>
                    <TableCell className="text-[14px] text-[var(--muted-foreground)]">
                      {r.hostelName}
                    </TableCell>
                    <TableCell className="text-[14px]">
                      {r.roomNumber !== "—" ? `Room ${r.roomNumber}` : "—"}
                    </TableCell>
                    <TableCell className="text-[14px] text-[var(--muted-foreground)] tabular-nums">
                      {formatDate(r.student.checkIn)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[r.student.status]}>
                        {r.student.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.monthlyFee !== null
                        ? formatCurrency(r.monthlyFee, currency)
                        : "—"}
                    </TableCell>
                    <TableCell className="pr-6">
                      {r.paymentStatus ? (
                        <Badge variant={paymentVariant[r.paymentStatus]}>
                          {r.paymentStatus}
                        </Badge>
                      ) : (
                        <span className="text-xs text-[var(--muted-foreground)]">
                          —
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-[var(--muted-foreground)]">
        Showing {rows.length} of {students.length} students
      </div>
    </div>
  )
}

function SortHeader({
  label,
  sortKey,
  col,
  dir,
  onSort,
  align,
}: {
  label: string
  sortKey: SortKey
  col: SortKey
  dir: "asc" | "desc"
  onSort: (key: SortKey) => void
  align?: "left" | "right"
}) {
  const isActive = sortKey === col
  return (
    <button
      type="button"
      onClick={() => onSort(col)}
      className={`inline-flex items-center gap-1 font-medium uppercase tracking-wider text-[11px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] ${
        align === "right" ? "justify-end" : ""
      }`}
    >
      {label}
      <span className={isActive ? "opacity-100" : "opacity-30"}>
        {isActive ? (dir === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </button>
  )
}

export function StudentsReportSkeleton() {
  return <ReportTableSkeleton rows={8} cols={8} />
}
