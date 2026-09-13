import { useEffect, useMemo, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UserRound, Activity, Banknote } from "lucide-react"
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
import { KpiTile } from "./KpiTile"
import { useDataStore } from "@/stores/dataStore"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { ExportColumn } from "./export"
import {
  visitorStatusVariant,
  paymentStatusVariant,
} from "@/components/ui/badgeVariants"

type StatusFilter = "all" | "active" | "historical"

interface VisitorsReportProps {
  onExportReady?: (payload: {
    rows: Array<{
      name: string
      phone: string
      cnic: string
      studentName: string
      studentCode: string
      hostelName: string
      roomNumber: string
      relationship: string | null
      status: string
      paymentStatus: string
      nights: number
      perNight: number
      total: number
      checkIn: string
      expectedCheckOut: string
      actualCheckOut: string | null
    }>
    columns: ExportColumn<{
      name: string
      phone: string
      cnic: string
      studentName: string
      studentCode: string
      hostelName: string
      roomNumber: string
      relationship: string | null
      status: string
      paymentStatus: string
      nights: number
      perNight: number
      total: number
      checkIn: string
      expectedCheckOut: string
      actualCheckOut: string | null
    }>[]
    sheetTitle: string
  }) => void
}

export function VisitorsReport({ onExportReady }: VisitorsReportProps = {}) {
  const hostels = useDataStore((s) => s.hostels)
  const rooms = useDataStore((s) => s.rooms)
  const students = useDataStore((s) => s.students)
  const visitors = useDataStore((s) => s.visitors)
  const currency = useDataStore((s) => s.settings.currency)

  const [search, setSearch] = useState("")
  const [hostelFilter, setHostelFilter] = useState("all")
  const [studentFilter, setStudentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [range, setRange] = useState<DateRange>({})

  const hostelById = new Map(hostels.map((h) => [h.id, h]))
  const roomById = new Map(rooms.map((r) => [r.id, r]))
  const studentById = new Map(students.map((s) => [s.id, s]))

  const rows = useMemo(() => {
    return visitors
      .filter((v) => {
        if (search) {
          const q = search.toLowerCase()
          const student = studentById.get(v.studentId)
          const hay = [
            v.name,
            v.phone,
            v.cnic,
            student?.name ?? "",
            student?.studentCode ?? "",
            roomById.get(v.roomId)?.number ?? "",
            hostelById.get(student?.hostelId ?? "")?.name ?? "",
          ]
            .join(" ")
            .toLowerCase()
          if (!hay.includes(q)) return false
        }
        if (statusFilter === "active" && v.actualCheckOut) return false
        if (statusFilter === "historical" && !v.actualCheckOut)
          return false
        if (hostelFilter !== "all") {
          const student = studentById.get(v.studentId)
          if (student?.hostelId !== hostelFilter) return false
        }
        if (studentFilter !== "all" && v.studentId !== studentFilter)
          return false
        if (range.from) {
          if (new Date(v.checkIn) < range.from) return false
        }
        if (range.to) {
          const checkOut = v.actualCheckOut
            ? new Date(v.actualCheckOut)
            : new Date()
          if (checkOut > range.to) return false
        }
        return true
      })
      .map((v) => {
        const student = studentById.get(v.studentId)
        const room = roomById.get(v.roomId)
        const hostel = student ? hostelById.get(student.hostelId) : undefined
        return {
          ...v,
          studentName: student?.name ?? "—",
          studentCode: student?.studentCode ?? "—",
          roomNumber: room?.number ?? "—",
          hostelName: hostel?.name ?? "—",
        }
      })
      .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())
  }, [visitors, search, statusFilter, hostelFilter, studentFilter, range, hostelById, roomById, studentById])

  const hasFilters =
    search !== "" ||
    hostelFilter !== "all" ||
    studentFilter !== "all" ||
    statusFilter !== "all" ||
    !!range.from ||
    !!range.to

  const visitorKpis = useMemo(() => {
    const total = visitors.length
    const active = visitors.filter((v) => !v.actualCheckOut).length
    const historical = total - active
    const revenue = visitors.reduce((sum, v) => sum + v.total, 0)
    return { total, active, historical, revenue }
  }, [visitors])

  useEffect(() => {
    if (!onExportReady) return
    onExportReady({
      rows: rows.map((r) => ({
        name: r.name,
        phone: r.phone,
        cnic: r.cnic,
        studentName: r.studentName,
        studentCode: r.studentCode,
        hostelName: r.hostelName,
        roomNumber: r.roomNumber,
        relationship: r.relationship,
        status: r.status,
        paymentStatus: r.paymentStatus,
        nights: r.nights,
        perNight: r.perNight,
        total: r.total,
        checkIn: r.checkIn,
        expectedCheckOut: r.expectedCheckOut,
        actualCheckOut: r.actualCheckOut ?? null,
      })),
      columns: [
        { header: "Visitor", accessor: (r) => r.name },
        { header: "Phone", accessor: (r) => r.phone },
        { header: "CNIC", accessor: (r) => r.cnic },
        { header: "Hostel Member", accessor: (r) => r.studentName },
        { header: "Student ID", accessor: (r) => r.studentCode },
        { header: "Hostel", accessor: (r) => r.hostelName },
        { header: "Room", accessor: (r) => r.roomNumber },
        { header: "Relationship", accessor: (r) => r.relationship ?? "" },
        { header: "Status", accessor: (r) => r.status },
        { header: "Payment", accessor: (r) => r.paymentStatus },
        { header: "Nights", accessor: (r) => String(r.nights), align: "right" },
        { header: "Total", accessor: (r) => String(r.total), align: "right" },
        { header: "Check-in", accessor: (r) => r.checkIn },
        { header: "Expected", accessor: (r) => r.expectedCheckOut },
        { header: "Actual", accessor: (r) => r.actualCheckOut ?? "" },
      ],
      sheetTitle: "Visitors Report",
    })
  }, [rows, onExportReady])

  return (
    <div className="space-y-4">
      {/* KPI Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiTile
          icon={UserRound}
          label="Total Visitors"
          value={visitorKpis.total}
          sub="all records"
        />
        <KpiTile
          icon={Activity}
          label="Currently Visiting"
          value={visitorKpis.active}
          sub={`${visitorKpis.historical} checked out`}
          accent="success"
        />
        <KpiTile
          icon={Banknote}
          label="Total Revenue"
          value={formatCurrency(visitorKpis.revenue, currency)}
          sub="all-time earnings"
        />
      </div>

      <ReportFiltersBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search visitors...",
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
        ]}
        custom={
          <>
            <Select value={studentFilter} onValueChange={setStudentFilter}>
              <SelectTrigger className="h-9 w-full sm:w-[170px]">
                <SelectValue placeholder="Any student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any student</SelectItem>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="h-9 w-full sm:w-[140px]">
                <SelectValue placeholder="All visitors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All visitors</SelectItem>
                <SelectItem value="active">Currently visiting</SelectItem>
                <SelectItem value="historical">Checked out</SelectItem>
              </SelectContent>
            </Select>
            <DateRangeFilter value={range} onChange={setRange} />
          </>
        }
        onClear={() => {
          setSearch("")
          setHostelFilter("all")
          setStudentFilter("all")
          setStatusFilter("all")
          setRange({})
        }}
        hasActiveFilters={hasFilters}
      />

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <Table className="table-fixed">
          <colgroup>
            <col className="w-[180px] pl-6" />
            <col />
            <col className="w-[150px]" />
            <col />
            <col className="w-[100px]" />
            <col className="w-[140px]" />
            <col className="w-[100px]" />
            <col className="w-[100px]" />
            <col className="w-[110px] pr-6" />
          </colgroup>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Visitor</TableHead>
              <TableHead>Hostel Member</TableHead>
              <TableHead>Hostel / Room</TableHead>
              <TableHead>Relationship</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Nights</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="pr-6">Check-in</TableHead>
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
                      setStudentFilter("all")
                      setStatusFilter("all")
                      setRange({})
                    }}
                    hasFilters={hasFilters}
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="pl-6">
                    <div className="flex flex-col">
                      <span className="font-medium text-[14px]">{v.name}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {v.phone}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[14px]">
                    {v.studentName}
                  </TableCell>
                  <TableCell className="text-[14px] text-[var(--muted-foreground)]">
                    {v.hostelName} / Room {v.roomNumber}
                  </TableCell>
                  <TableCell>
                    <Badge variant={relationshipVariant(v.relationship)}>
                      {v.relationship ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={visitorStatusVariant[v.status]}>
                      {v.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={paymentStatusVariant[v.paymentStatus]}>
                      {v.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[14px] tabular-nums">
                    {v.nights}
                  </TableCell>
                  <TableCell className="text-[14px] tabular-nums">
                    {v.total.toLocaleString()}
                  </TableCell>
                  <TableCell className="pr-6 text-[14px] text-[var(--muted-foreground)] tabular-nums whitespace-nowrap">
                    {formatDate(v.checkIn)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
        <span>
          Showing {rows.length} of {visitors.length} visitor records
        </span>
        <span>
          {visitorKpis.active} active · {visitorKpis.historical} checked out
        </span>
      </div>
    </div>
  )
}

function relationshipVariant(rel: string | null) {
  if (rel === "Family Member") return "info-soft"
  if (rel === "Friend") return "neutral-soft"
  return "muted"
}

export function VisitorsReportSkeleton() {
  return <ReportTableSkeleton rows={8} cols={9} />
}
