import { useEffect, useMemo, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Plus,
  Search,
  Wallet,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { useDataStore } from "@/stores/dataStore"
import {
  EMPTY_FINANCE_FILTERS,
  applyFinanceFilters,
  isFinanceFilterActive,
  projectFinanceRows,
  summarize,
  type FinanceFilters,
  type FinanceRow,
} from "./financeModel"
import { FinanceSummaryCards } from "./FinanceSummaryCards"
import { FinanceFilters as FinanceFiltersBar } from "./FinanceFilters"
import { PaymentDetailSheet } from "./PaymentDetailSheet"
import { StudentFinanceSheet } from "./StudentFinanceSheet"
import { RecordPaymentSheet } from "./RecordPaymentSheet"
import { currentMonthKey, formatDate } from "@/lib/utils"
import { paymentStatusVariant } from "@/components/ui/badgeVariants"

export function FinancePage() {
  const navigate = useNavigate()
  const hostels = useDataStore((s) => s.hostels)
  const rooms = useDataStore((s) => s.rooms)
  const students = useDataStore((s) => s.students)
  const payments = useDataStore((s) => s.payments)
  const visitors = useDataStore((s) => s.visitors)
  const settings = useDataStore((s) => s.settings)
  const recordStudentPayment = useDataStore((s) => s.recordStudentPayment)
  const recordVisitorPaymentAmount = useDataStore(
    (s) => s.recordVisitorPaymentAmount,
  )

  const [filters, setFilters] = useState<FinanceFilters>(
    EMPTY_FINANCE_FILTERS,
  )
  const [active, setActive] = useState<FinanceRow | null>(null)
  const [activeStudent, setActiveStudent] = useState<
    | { studentId: string; rowId?: string }
    | null
  >(null)
  const [recordOpen, setRecordOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  // Pagination
  const PAGE_SIZE = 10
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageRows = useMemo(
    () => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [rows, page],
  )
  // Reset to page 1 whenever filters change the result set
  useEffect(() => {
    setPage(1)
  }, [filters])

  // Clamp page if rows shrink below the current page
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  // First-load skeleton
  useMemo(() => {
    setIsLoading(true)
    const t = setTimeout(() => setIsLoading(false), 250)
    return () => clearTimeout(t)
  }, [])

  // Available months (descending)
  const months = useMemo(() => {
    const set = new Set<string>()
    for (const p of payments) set.add(p.month)
    for (const v of visitors) set.add(v.checkIn.slice(0, 7))
    return Array.from(set).sort().reverse()
  }, [payments, visitors])

  // Project all rows once
  const allRows = useMemo(
    () => projectFinanceRows(payments, visitors, students, rooms, hostels),
    [payments, visitors, students, rooms, hostels],
  )

  // Apply filters
  const studentById = useMemo(
    () => new Map(students.map((s) => [s.id, s])),
    [students],
  )
  const rows = useMemo(
    () => applyFinanceFilters(allRows, filters, studentById),
    [allRows, filters, studentById],
  )

  // Scope payments by the same filters (for "expected revenue" + accurate collected totals)
  const paymentsForExpected = useMemo(() => {
    return payments.filter((p) => {
      if (filters.hostelId !== "all") {
        const stu = students.find((s) => s.id === p.studentId)
        if (stu?.hostelId !== filters.hostelId) return false
      }
      if (filters.month !== "all" && p.month !== filters.month) return false
      if (filters.status !== "all" && p.status !== filters.status) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const stu = students.find((s) => s.id === p.studentId)
        const hay = [
          stu?.name ?? "",
          stu?.studentCode ?? "",
          stu?.phone ?? "",
        ]
          .join(" ")
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (filters.rangeFrom) {
        if (new Date(p.month + "-01") < new Date(filters.rangeFrom)) return false
      }
      if (filters.rangeTo) {
        const endOfMonth = new Date(p.month + "-01")
        endOfMonth.setMonth(endOfMonth.getMonth() + 1)
        endOfMonth.setDate(0)
        if (endOfMonth > new Date(filters.rangeTo)) return false
      }
      return true
    })
  }, [payments, students, filters])

  const summary = useMemo(
    () => summarize(rows, paymentsForExpected),
    [rows, paymentsForExpected],
  )

  const handleRecordStudentPayment = ({
    studentId,
    month,
    amount,
    paidDate,
  }: {
    studentId: string
    month: string
    amount: number
    paidDate: string
  }) => {
    recordStudentPayment({
      studentId,
      month,
      delta: amount,
      paidDate,
    })
    toast.success("Accommodation payment recorded")
  }

  const handleRecordVisitorPayment = ({
    visitorId,
    amount,
    paidDate,
  }: {
    visitorId: string
    amount: number
    paidDate: string
  }) => {
    recordVisitorPaymentAmount({
      visitorId,
      delta: amount,
      paidDate,
    })
    toast.success("Guest payment recorded")
  }

  const hasActive = isFinanceFilterActive(filters)

  return (
    <>
      <PageHeader
        title="Finance"
        description="Manage nomad fees, guest payments, outstanding balances and financial records across all hostels."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                exportFinanceRowsToCSV(rows, settings.currency)
                toast.success(
                  `Exported ${rows.length} finance record${rows.length === 1 ? "" : "s"}`,
                )
              }}
              disabled={rows.length === 0}
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
            <Button onClick={() => setRecordOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Record Payment
            </Button>
          </div>
        }
      />

      <div className="space-y-4 p-4 lg:p-6">
        {/* Summary */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-7 w-32" />
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <FinanceSummaryCards summary={summary} currency={settings.currency} />
        )}

        {/* Filters */}
        <FinanceFiltersBar
          filters={filters}
          onChange={setFilters}
          hostels={hostels}
          months={months}
          onClear={() => setFilters(EMPTY_FINANCE_FILTERS)}
        />

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <Table className="table-fixed">
            <colgroup>
              <col className="w-[200px] pl-6" />
              <col className="w-[140px]" />
              <col className="w-[90px]" />
              <col className="w-[150px]" />
              <col className="w-[120px]" />
              <col className="w-[152px] pr-6" />
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Nomad</TableHead>
                <TableHead>Hostel</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    <TableCell className="pl-6">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Skeleton className="ml-auto h-7 w-7 rounded-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      message="No financial records found"
                      description="There are no payments matching the current filters."
                      onClear={() => setFilters(EMPTY_FINANCE_FILTERS)}
                      showClear={hasActive}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((r) => {
                  const isAccommodation = r.type === "accommodation"
                  const isIndependent =
                    r.type === "visitor" && r.kind === "independent"
                  return (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer"
                      onClick={() => setActive(r)}
                    >
                      <TableCell className="pl-6">
                        <div className="flex flex-col">
                          <span className="truncate font-medium text-[14px]">
                            {r.studentName}
                          </span>
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {r.studentCode}
                          </span>
                          {isIndependent && (
                            <span className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                              Walk-in · {r.visitorName}
                            </span>
                          )}
                          {!isAccommodation && !isIndependent && (
                            <span className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                              via {r.visitorName}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-[14px] text-[var(--muted-foreground)]">
                        <span className="block truncate" title={r.hostelName}>
                          {r.hostelName}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-[14px] text-[var(--muted-foreground)]">
                        {isIndependent ? "—" : `Room ${r.roomNumber}`}
                      </TableCell>
                      <TableCell>
                        {isAccommodation ? (
                          <Badge variant="neutral-soft">Accommodation</Badge>
                        ) : isIndependent ? (
                          <Badge variant="warning-soft">Independent Guest</Badge>
                        ) : (
                          <Badge variant="info-soft">Guest Stay</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={paymentStatusVariant[r.status]}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="pr-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <RowActions
                          row={r}
                          isIndependent={isIndependent}
                          onView={() => setActive(r)}
                          onRecord={() => {
                            setActive(r)
                          }}
                          onOpenStudentFinance={() =>
                            !isIndependent &&
                            setActiveStudent({
                              studentId: r.studentId as string,
                              rowId: r.id,
                            })
                          }
                        />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <span>
            {rows.length === 0
              ? "No records"
              : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                  page * PAGE_SIZE,
                  rows.length,
                )} of ${rows.length} financial records`}
          </span>
          <div className="flex items-center gap-3">
            {filters.month === "all" && (
              <span>Current billing month: {currentMonthKey()}</span>
            )}
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </Button>
              <span className="px-1 tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Row detail */}
      <PaymentDetailSheet
        open={!!active}
        onOpenChange={(o) => !o && setActive(null)}
        row={active}
        currency={settings.currency}
        onRecordStudentPayment={handleRecordStudentPayment}
        onRecordVisitorPayment={handleRecordVisitorPayment}
        onViewStudent={(id) => {
          setActive(null)
          navigate(`/students/${id}`)
        }}
      />

      {/* Student finance sheet */}
      <StudentFinanceSheet
        open={!!activeStudent}
        onOpenChange={(o) => !o && setActiveStudent(null)}
        studentId={activeStudent?.studentId ?? null}
        currency={settings.currency}
        onOpenVisitor={(visitorId) => {
          setActiveStudent(null)
          // open the visitor detail via the visitors page if user wants
          // we just toast and navigate here
          navigate("/visitors")
          void visitorId
        }}
      />

      {/* Record payment sheet */}
      <RecordPaymentSheet
        open={recordOpen}
        onOpenChange={setRecordOpen}
        students={students}
        hostels={hostels}
        rooms={rooms}
        visitors={visitors}
        payments={payments}
        currency={settings.currency}
        onRecordStudent={handleRecordStudentPayment}
        onRecordVisitor={handleRecordVisitorPayment}
      />
    </>
  )
}

function RowActions({
  row,
  isIndependent,
  onView,
  onRecord,
  onOpenStudentFinance,
}: {
  row: FinanceRow
  isIndependent: boolean
  onView: () => void
  onRecord: () => void
  onOpenStudentFinance: () => void
}) {
  const navigate = useNavigate()
  const btnBase =
    "inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
  return (
    <div className="flex items-center justify-end gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="View payment"
            onClick={(e) => {
              e.stopPropagation()
              onView()
            }}
            className={`${btnBase} bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]`}
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>View payment</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Record payment"
            onClick={(e) => {
              e.stopPropagation()
              onRecord()
            }}
            className={`${btnBase} bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Record payment</TooltipContent>
      </Tooltip>

      {!isIndependent && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Open nomad finance"
              onClick={(e) => {
                e.stopPropagation()
                onOpenStudentFinance()
              }}
              className={`${btnBase} bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]`}
            >
              <Wallet className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Nomad finance</TooltipContent>
        </Tooltip>
      )}

      {!isIndependent && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="View nomad profile"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/students/${row.studentId}`)
              }}
              className={`${btnBase} bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]`}
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>View nomad</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

function EmptyState({
  message,
  description,
  onClear,
  showClear,
}: {
  message: string
  description: string
  onClear: () => void
  showClear: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
        <Receipt className="h-4 w-4" />
      </div>
      <h3 className="mt-4 font-display text-base font-semibold">{message}</h3>
      <p className="mt-1 max-w-sm text-sm text-[var(--muted-foreground)]">
        {description}
      </p>
      {showClear && (
        <Button variant="outline" size="sm" onClick={onClear} className="mt-4">
          Clear Filters
        </Button>
      )}
    </div>
  )
}

function exportFinanceRowsToCSV(rows: FinanceRow[], currency: string) {
  const headers = [
    "Nomad",
    "Nomad ID",
    "Type",
    "Hostel",
    "Room",
    "Guest (if any)",
    "Description",
    "Month",
    "Amount",
    "Paid",
    "Remaining",
    "Status",
    "Paid Date",
  ]
  const escape = (v: string | number | null | undefined) => {
    if (v === null || v === undefined) return ""
    const s = String(v)
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const dataRows = rows.map((r) => {
    const isAccommodation = r.type === "accommodation"
    const typeLabel = isAccommodation
      ? "Accommodation"
      : r.kind === "independent"
        ? "Independent Guest"
        : "Guest Stay"
    const room = isAccommodation ? `Room ${r.roomNumber}` : "—"
    const visitor = isAccommodation ? "" : r.visitorName
    return [
      r.studentName,
      r.studentCode,
      typeLabel,
      r.hostelName,
      room,
      visitor,
      r.description,
      r.month,
      r.amount,
      r.paid,
      r.remaining,
      r.status,
      r.paidDate ? formatDate(r.paidDate) : "",
    ]
  })
  void currency
  const csv = [headers, ...dataRows]
    .map((r) => r.map(escape).join(","))
    .join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `finance-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
