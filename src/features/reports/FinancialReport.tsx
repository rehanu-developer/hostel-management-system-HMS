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
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ReportFiltersBar } from "./ReportFiltersBar"
import { DateRangeFilter, type DateRange } from "./DateRangeFilter"
import { ReportTableSkeleton, ReportEmptyState } from "./ReportTable"
import { useDataStore } from "@/stores/dataStore"
import { formatCurrency, formatDate, formatMonth } from "@/lib/utils"
import type { PaymentStatus } from "@/types"
import { paymentStatusVariant } from "@/components/ui/badgeVariants"
import type { ExportColumn } from "./export"

type PaymentTypeFilter = "all" | "accommodation" | "visitor"

interface FinancialReportProps {
  onExportReady?: (payload: {
    rows: Array<{
      type: string
      studentName: string
      studentCode: string
      hostelName: string
      roomNumber: string
      visitingStudent?: string
      visitorName?: string
      amount: number
      status: string
      paidDate: string | null
      month: string
    }>
    columns: ExportColumn<{
      type: string
      studentName: string
      studentCode: string
      hostelName: string
      roomNumber: string
      visitingStudent?: string
      visitorName?: string
      amount: number
      status: string
      paidDate: string | null
      month: string
    }>[]
    sheetTitle: string
  }) => void
}

interface UnifiedRow {
  type: "accommodation" | "visitor"
  studentId: string | undefined
  studentName: string
  studentCode: string
  hostelName: string
  roomNumber: string
  visitingStudent?: string
  visitorName?: string
  amount: number
  paid: number
  status: PaymentStatus
  paidDate: string | null
  month: string
}

export function FinancialReport({ onExportReady }: FinancialReportProps = {}) {
  const hostels = useDataStore((s) => s.hostels)
  const rooms = useDataStore((s) => s.rooms)
  const students = useDataStore((s) => s.students)
  const payments = useDataStore((s) => s.payments)
  const visitors = useDataStore((s) => s.visitors)
  const currency = useDataStore((s) => s.settings.currency)
  const navigate = useNavigate()

  const [search, setSearch] = useState("")
  const [hostelFilter, setHostelFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [monthFilter, setMonthFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState<PaymentTypeFilter>("all")
  const [range, setRange] = useState<DateRange>({})

  const hostelById = new Map(hostels.map((h) => [h.id, h]))
  const roomById = new Map(rooms.map((r) => [r.id, r]))
  const studentById = new Map(students.map((s) => [s.id, s]))

  // Available months (descending)
  const months = useMemo(() => {
    const set = new Set<string>()
    for (const p of payments) set.add(p.month)
    for (const v of visitors) set.add(v.checkIn.slice(0, 7))
    return Array.from(set).sort().reverse()
  }, [payments, visitors])

  // Project all payments + visitor stays into a unified row shape.
  const projected: UnifiedRow[] = useMemo(() => {
    const accRows: UnifiedRow[] = payments
      .filter((p) => (p.type ?? "accommodation") === "accommodation")
      .map((p) => {
        const student = studentById.get(p.studentId)
        const room = student ? roomById.get(student.roomId) : undefined
        const hostel = student ? hostelById.get(student.hostelId) : undefined
        return {
          type: "accommodation",
          studentId: p.studentId,
          studentName: student?.name ?? "—",
          studentCode: student?.studentCode ?? "—",
          hostelName: hostel?.name ?? "—",
          roomNumber: room?.number ?? "—",
          amount: p.amount,
          paid: p.paid ?? 0,
          status: p.status,
          paidDate: p.paidDate ?? null,
          month: p.month,
        }
      })

    const visitorRows: UnifiedRow[] = visitors.map((v) => {
      const student = v.studentId ? studentById.get(v.studentId) : undefined
      const room = v.roomId ? roomById.get(v.roomId) : undefined
      const hostel = hostelById.get(v.hostelId)
      const month = v.checkIn.slice(0, 7)
      return {
        type: "visitor",
        studentId: v.studentId,
        studentName:
          v.kind === "independent" ? "Independent Guest" : (student?.name ?? "—"),
        studentCode: v.kind === "independent" ? "—" : (student?.studentCode ?? "—"),
        hostelName: hostel?.name ?? "—",
        roomNumber: room?.number ?? "—",
        visitingStudent: student?.name ?? "—",
        visitorName: v.name,
        amount: v.total,
        paid: v.paid ?? 0,
        status: v.paymentStatus,
        paidDate: v.paymentStatus === "Paid" ? v.checkIn : null,
        month,
      }
    })

    return [...accRows, ...visitorRows]
  }, [payments, visitors, hostelById, roomById, studentById])

  const rows = useMemo(() => {
    return projected
      .filter((r) => {
        if (typeFilter !== "all" && r.type !== typeFilter) return false
        if (search) {
          const q = search.toLowerCase()
          const hay = [
            r.studentName,
            r.studentCode,
            r.hostelName,
            r.visitorName ?? "",
          ]
            .join(" ")
            .toLowerCase()
          if (!hay.includes(q)) return false
        }
        if (statusFilter !== "all" && r.status !== statusFilter) return false
        if (monthFilter !== "all" && r.month !== monthFilter) return false
        if (hostelFilter !== "all" && r.hostelName !== hostelFilter) {
          // Independent visitor rows already have hostelName set; only accommodation
          // (and linked visitors) need a re-derive through the student.
          const student = r.studentId ? studentById.get(r.studentId) : undefined
          if (student?.hostelId !== hostelFilter) return false
        }
        if (range.from) {
          const d = new Date(r.month + "-01")
          if (d < range.from) return false
        }
        if (range.to) {
          const d = new Date(r.month + "-01")
          const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0)
          if (endOfMonth > range.to) return false
        }
        return true
      })
      .sort((a, b) => b.month.localeCompare(a.month))
  }, [
    projected,
    search,
    statusFilter,
    monthFilter,
    hostelFilter,
    typeFilter,
    range,
    studentById,
  ])

  const summary = useMemo(() => {
    const collected = rows
      .filter((r) => r.status === "Paid")
      .reduce((sum, r) => sum + r.amount, 0)
    const pending = rows
      .filter(
        (r) =>
          r.status === "Pending" ||
          r.status === "Outstanding" ||
          r.status === "Partially Paid",
      )
      .reduce((sum, r) => sum + r.amount, 0)
    const pendingStudents = new Set(
      rows
        .filter(
          (r) =>
            r.status === "Pending" ||
            r.status === "Outstanding" ||
            r.status === "Partially Paid",
        )
        .map((r) => r.studentId),
    ).size
    return { collected, pending, pendingStudents, total: rows.length }
  }, [rows])

  const hasFilters =
    search !== "" ||
    hostelFilter !== "all" ||
    statusFilter !== "all" ||
    monthFilter !== "all" ||
    typeFilter !== "all" ||
    !!range.from ||
    !!range.to

  useEffect(() => {
    if (!onExportReady) return
    onExportReady({
      rows: rows.map((r) => ({
        type: r.type === "accommodation" ? "Student Accommodation" : "Visitor Stay",
        studentName: r.studentName,
        studentCode: r.studentCode,
        hostelName: r.hostelName,
        roomNumber: r.roomNumber,
        visitingStudent: r.visitingStudent,
        visitorName: r.visitorName,
        amount: r.amount,
        status: r.status,
        paidDate: r.paidDate,
        month: r.month,
      })),
      columns: [
        {
          header: "Payment Type",
          accessor: (r) =>
            r.type === "accommodation" ? "Student Accommodation" : "Visitor Stay",
        },
        { header: "Nomad", accessor: (r) => r.studentName },
        { header: "Nomad ID", accessor: (r) => r.studentCode },
        { header: "Hostel", accessor: (r) => r.hostelName },
        { header: "Room", accessor: (r) => r.roomNumber },
        { header: "Guest", accessor: (r) => r.visitorName ?? "" },
        { header: "Month", accessor: (r) => formatMonth(r.month) },
        { header: "Amount", accessor: (r) => String(r.amount), align: "right" },
        { header: "Status", accessor: (r) => r.status },
        { header: "Payment Date", accessor: (r) => r.paidDate ?? "" },
      ],
      sheetTitle: "Financial Report",
    })
  }, [rows, onExportReady])

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Total Collected"
          value={formatCurrency(summary.collected, currency)}
          hint={`${rows.filter((r) => r.status === "Paid").length} paid records`}
          accent="success"
        />
        <SummaryCard
          label="Pending Amount"
          value={formatCurrency(summary.pending, currency)}
          hint={`${summary.pendingStudents} records with pending fees`}
          accent="warning"
        />
        <SummaryCard
          label="Total Records"
          value={String(summary.total)}
          hint={`${months.length} months tracked`}
        />
      </div>

      {/* Filters */}
      <ReportFiltersBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search nomads or guests...",
        }}
        selects={[
          {
            value: typeFilter,
            onChange: (v) => setTypeFilter(v as PaymentTypeFilter),
            placeholder: "All payment types",
            options: [
              { value: "all", label: "All payment types" },
              {
                value: "accommodation",
                label: "Nomad Accommodation",
              },
              { value: "visitor", label: "Guest Stay" },
            ],
            width: "sm:w-[190px]",
          },
          {
            value: hostelFilter,
            onChange: setHostelFilter,
            placeholder: "All hostels",
            options: [
              { value: "all", label: "All hostels" },
              ...hostels.map((h) => ({ value: h.name, label: h.name })),
            ],
            width: "sm:w-[160px]",
          },
          {
            value: monthFilter,
            onChange: setMonthFilter,
            placeholder: "All months",
            options: [
              { value: "all", label: "All months" },
              ...months.map((m) => ({ value: m, label: formatMonth(m) })),
            ],
            width: "sm:w-[150px]",
          },
          {
            value: statusFilter,
            onChange: setStatusFilter,
            placeholder: "All statuses",
            options: [
              { value: "all", label: "All statuses" },
              { value: "Paid", label: "Paid" },
              { value: "Pending", label: "Pending" },
              { value: "Partially Paid", label: "Partially Paid" },
              { value: "Outstanding", label: "Outstanding" },
            ],
            width: "sm:w-[160px]",
          },
        ]}
        custom={<DateRangeFilter value={range} onChange={setRange} />}
        onClear={() => {
          setSearch("")
          setHostelFilter("all")
          setStatusFilter("all")
          setMonthFilter("all")
          setTypeFilter("all")
          setRange({})
        }}
        hasActiveFilters={hasFilters}
      />

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <Table className="table-fixed">
          <colgroup>
            <col className="w-[150px] pl-6" />
            <col />
            <col className="w-[170px]" />
            <col className="w-[110px]" />
            <col className="w-[120px]" />
            <col className="w-[130px]" />
            <col className="w-[110px]" />
            <col className="w-[120px]" />
            <col className="w-[120px] pr-6" />
          </colgroup>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Type</TableHead>
              <TableHead>Nomad / Guest</TableHead>
              <TableHead>Hostel / Room</TableHead>
              <TableHead className="text-right">Monthly Fee</TableHead>
              <TableHead className="text-right">Amount Paid</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead className="pr-6">Month</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="p-0">
                  <ReportEmptyState
                    onClear={() => {
                      setSearch("")
                      setHostelFilter("all")
                      setStatusFilter("all")
                      setMonthFilter("all")
                      setTypeFilter("all")
                      setRange({})
                    }}
                    hasFilters={hasFilters}
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r, idx) => {
                const amountPaid = r.paid ?? 0
                const finalOutstanding = Math.max(0, r.amount - amountPaid)
                const isVisitor = r.type === "visitor"
                return (
                  <TableRow
                    key={`${r.type}-${r.studentId}-${r.month}-${idx}`}
                    className={isVisitor ? "" : "cursor-pointer"}
                    onClick={() => {
                      if (!isVisitor) navigate(`/students/${r.studentId}`)
                    }}
                  >
                    <TableCell className="pl-6">
                      <Badge
                        variant={isVisitor ? "info-soft" : "neutral-soft"}
                      >
                        {isVisitor ? "Guest Stay" : "Nomad"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-[14px]">
                          {isVisitor
                            ? r.visitorName ?? "—"
                            : r.studentName}
                        </span>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {isVisitor
                            ? `Visiting: ${r.studentName}`
                            : r.studentCode}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[14px] text-[var(--muted-foreground)]">
                      {r.hostelName} / Room {r.roomNumber}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(r.amount, currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(amountPaid, currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(finalOutstanding, currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={paymentStatusVariant[r.status]}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-[14px] text-[var(--muted-foreground)] tabular-nums whitespace-nowrap">
                      {r.paidDate ? formatDate(r.paidDate) : "—"}
                    </TableCell>
                    <TableCell className="pr-6 text-[14px]">
                      {formatMonth(r.month)}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-[var(--muted-foreground)]">
        Showing {rows.length} of {projected.length} payment records
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string | number
  hint?: string
  accent?: "success" | "warning"
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
          {label}
        </p>
        <p
          className={
            "mt-1 font-display text-2xl font-semibold tabular-nums " +
            (accent === "success"
              ? "text-[var(--success-soft-foreground)]"
              : accent === "warning"
                ? "text-[var(--warning-soft-foreground)]"
                : "")
          }
        >
          {value}{" "}
          <span className="text-xs font-normal text-[var(--muted-foreground)]">
            {hint}
          </span>
        </p>
      </CardContent>
    </Card>
  )
}

export function FinancialReportSkeleton() {
  return <ReportTableSkeleton rows={8} cols={9} />
}
