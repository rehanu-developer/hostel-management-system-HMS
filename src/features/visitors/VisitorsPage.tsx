import { useMemo, useState } from "react"
import { Check, Plus, Search } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import {
  visitorStatusVariant,
  paymentStatusVariant,
} from "@/components/ui/badgeVariants"
import { AddVisitorSheet } from "./AddVisitorSheet"
import { VisitorDetailSheet } from "./VisitorDetailSheet"
import { useSheetCloseGuard } from "@/features/students/useSheetCloseGuard.tsx"
import { useDataStore } from "@/stores/dataStore"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { PaymentStatus, Visitor, VisitorStatus } from "@/types"

type StatusFilter = "all" | "active" | "checked"
// Visitor payment filter — excludes "Partially Paid" per UX requirement
type PaymentFilter = "all" | "paid" | "pending" | "outstanding"

export function Visitors() {
  const hostels = useDataStore((s) => s.hostels)
  const rooms = useDataStore((s) => s.rooms)
  const students = useDataStore((s) => s.students)
  const visitors = useDataStore((s) => s.visitors)
  const settings = useDataStore((s) => s.settings)
  const checkInVisitor = useDataStore((s) => s.checkInVisitor)
  const checkOutVisitor = useDataStore((s) => s.checkOutVisitor)
  const updateVisitor = useDataStore((s) => s.updateVisitor)

  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all")
  const [active, setActive] = useState<Visitor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDirty, setIsDirty] = useState(false)
  const { handleOpenChange, GuardDialog } = useSheetCloseGuard({
    open: addOpen,
    onOpenChange: setAddOpen,
    isDirty,
  })

  // First-load skeleton
  useMemo(() => {
    setIsLoading(true)
    const t = setTimeout(() => setIsLoading(false), 250)
    return () => clearTimeout(t)
  }, [])

  const hostelById = useMemo(
    () => new Map(hostels.map((h) => [h.id, h])),
    [hostels],
  )
  const roomById = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms])
  const studentById = useMemo(
    () => new Map(students.map((s) => [s.id, s])),
    [students],
  )

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return visitors
      .filter((v) => {
        if (q) {
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
        if (statusFilter === "active" && v.status !== "Visiting")
          return false
        if (statusFilter === "checked" && v.status !== "Checked Out")
          return false
        if (paymentFilter !== "all") {
          const cur = (v.paymentStatus ?? "").toLowerCase().replace(/\s+/g, "")
          if (paymentFilter === "paid" && cur !== "paid") return false
          if (paymentFilter === "pending" && cur !== "pending") return false
          if (paymentFilter === "outstanding" && cur !== "outstanding") return false
        }
        return true
      })
      .sort(
        (a, b) =>
          new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime(),
      )
  }, [
    visitors,
    search,
    statusFilter,
    paymentFilter,
    hostelById,
    roomById,
    studentById,
  ])

  const activeCount = visitors.filter((v) => v.status === "Visiting").length

  const handleConfirmAdd = (values: {
    name: string
    phone: string
    cnic: string
    studentId?: string
    hostelId: string
    kind: "linked" | "independent"
    relationship: "Friend" | "Family Member" | "Other" | null
    checkIn: string
    expectedCheckOut: string
    nights: number
    perNight: number
    notes?: string
  }) => {
    const student = values.studentId
      ? students.find((s) => s.id === values.studentId)
      : undefined
    const total = values.perNight * values.nights
    checkInVisitor({
      name: values.name,
      phone: values.phone,
      cnic: values.cnic,
      kind: values.kind,
      studentId: values.studentId,
      hostelId: values.hostelId,
      roomId: student?.roomId ?? "",
      relationship: values.relationship,
      checkIn: new Date(values.checkIn).toISOString(),
      expectedCheckOut: new Date(values.expectedCheckOut).toISOString(),
      nights: values.nights,
      perNight: values.perNight,
      total,
      status: "Visiting",
      paymentStatus: "Pending",
      notes: values.notes,
    })
    toast.success(`${values.name} checked in`)
    setAddOpen(false)
  }

  const handleCheckOut = (visitorId: string) => {
    checkOutVisitor(visitorId)
    const v = visitors.find((x) => x.id === visitorId)
    toast.success(`${v?.name ?? "Visitor"} checked out`)
  }

  const handleChangeStatus = (visitorId: string, status: VisitorStatus) => {
    const patch: Partial<Visitor> = { status }
    if (status === "Checked Out") {
      patch.actualCheckOut = new Date().toISOString()
    }
    updateVisitor(visitorId, patch)
    const v = visitors.find((x) => x.id === visitorId)
    toast.success(`${v?.name ?? "Visitor"} → ${status}`)
  }

  const handleChangePayment = (visitorId: string, paymentStatus: PaymentStatus) => {
    updateVisitor(visitorId, { paymentStatus })
    const v = visitors.find((x) => x.id === visitorId)
    toast.success(`${v?.name ?? "Visitor"} payment → ${paymentStatus}`)
  }

  const handleEditSave = (patch: Partial<Visitor>) => {
    if (!active) return
    updateVisitor(active.id, patch)
    setActive({ ...active, ...patch })
    toast.success(`${active.name} updated`)
  }

  const activeStudent = active?.studentId
    ? studentById.get(active.studentId) ?? null
    : null
  const activeHostel = active
    ? hostelById.get(active.hostelId) ?? null
    : null
  const activeRoom = active?.roomId
    ? roomById.get(active.roomId) ?? null
    : null

  return (
    <>
      <PageHeader
        title="Visitors"
        description="Manage visitor check-ins and hostel guest records."
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Visitor
          </Button>
        }
      />

      <div className="space-y-4 p-4 lg:p-6">
        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatChip label="Currently Visiting" value={activeCount} />
          <StatChip
            label="Total Records"
            value={visitors.length}
            sub="all-time"
          />
          <StatChip
            label="Pending Payment"
            value={visitors.filter((v) => v.paymentStatus !== "Paid").length}
            sub="visitors"
          />
          <StatChip
            label="Today's Charges"
            value={formatCurrency(
              visitors
                .filter((v) => v.status === "Visiting")
                .reduce((sum, v) => sum + v.total, 0),
              settings.currency,
            )}
            sub="active stays"
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              placeholder="Search visitors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8"
              aria-label="Search visitors"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="h-9 w-full sm:w-[170px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Visiting</SelectItem>
              <SelectItem value="checked">Checked Out</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={paymentFilter}
            onValueChange={(v) => setPaymentFilter(v as PaymentFilter)}
          >
            <SelectTrigger className="h-9 w-full sm:w-[170px]">
              <SelectValue placeholder="All payments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All payments</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="outstanding">Outstanding</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <Table className="table-fixed">
            <colgroup>
              <col className="w-[200px] pl-6" />
              <col />
              <col className="w-[170px]" />
              <col />
              <col className="w-[130px]" />
              <col className="w-[130px]" />
              <col className="w-[110px] pr-6" />
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Visitor</TableHead>
                <TableHead>Visiting Student</TableHead>
                <TableHead>Hostel / Room</TableHead>
                <TableHead>Relationship</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="pr-6 text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    <TableCell className="pl-6">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-36" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Skeleton className="ml-auto h-4 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyVisitorsState onAdd={() => setAddOpen(true)} />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((v) => {
                  const stu = v.studentId ? studentById.get(v.studentId) : undefined
                  const h = hostelById.get(v.hostelId)
                  const r = v.roomId ? roomById.get(v.roomId) : undefined
                  return (
                    <TableRow
                      key={v.id}
                      className="cursor-pointer"
                      onClick={() => setActive(v)}
                    >
                      <TableCell className="pl-6">
                        <div className="flex flex-col">
                          <span className="font-medium text-[14px]">
                            {v.name}
                          </span>
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {v.phone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[14px]">
                        {v.kind === "independent" ? (
                          <span className="text-[var(--muted-foreground)] italic">
                            Independent
                          </span>
                        ) : (
                          stu?.name ?? "—"
                        )}
                      </TableCell>
                      <TableCell className="text-[14px] text-[var(--muted-foreground)]">
                        {h?.name ?? "—"}
                        {r && ` / Room ${r.number}`}
                      </TableCell>
                      <TableCell>
                        {v.kind === "independent" ? (
                          <Badge variant="warning-soft">Independent</Badge>
                        ) : (
                          <Badge variant={relationshipVariant(v.relationship)}>
                            {v.relationship ?? "—"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <VisitorStatusDropdown
                          visitor={v}
                          onChange={(s) => handleChangeStatus(v.id, s)}
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <VisitorPaymentDropdown
                          visitor={v}
                          onChange={(p) => handleChangePayment(v.id, p)}
                        />
                      </TableCell>
                      <TableCell className="pr-6 text-right tabular-nums text-[14px]">
                        {formatCurrency(v.total, settings.currency)}
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
            Showing {rows.length} of {visitors.length} visitor records
          </span>
          <span>
            Check-in {visitors.length > 0
              ? formatDate(visitors.sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())[0].checkIn)
              : "—"}
          </span>
        </div>
      </div>

      <AddVisitorSheet
        open={addOpen}
        onOpenChange={handleOpenChange}
        hostels={hostels}
        rooms={rooms}
        students={students}
        onConfirm={handleConfirmAdd}
      />

      <VisitorDetailSheet
        open={!!active}
        onOpenChange={(o) => !o && setActive(null)}
        visitor={active}
        student={activeStudent}
        hostel={activeHostel}
        room={activeRoom}
        onCheckOut={handleCheckOut}
        onEdit={() => {
          /* Edit handled in-place via the payment dropdown; full edit can be expanded later. */
        }}
      />

      {GuardDialog}
    </>
  )
}

function StatChip({
  label,
  value,
  sub,
}: {
  label: string
  value: number | string
  sub?: string
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-semibold tabular-nums">
        {value}
      </p>
      {sub && (
        <p className="text-[11px] text-[var(--muted-foreground)]">{sub}</p>
      )}
    </div>
  )
}

function EmptyVisitorsState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
        <Search className="h-4 w-4" />
      </div>
      <h3 className="mt-4 font-display text-base font-semibold">
        No visitors found
      </h3>
      <p className="mt-1 max-w-sm text-sm text-[var(--muted-foreground)]">
        Try changing your search or filters, or add a new visitor.
      </p>
      <Button onClick={onAdd} className="mt-4">
        <Plus className="h-3.5 w-3.5" />
        Add Visitor
      </Button>
    </div>
  )
}

function relationshipVariant(rel: string | null) {
  if (rel === "Family Member") return "info-soft"
  if (rel === "Friend") return "neutral-soft"
  return "muted"
}

function VisitorStatusDropdown({
  visitor,
  onChange,
}: {
  visitor: Visitor
  onChange: (s: VisitorStatus) => void
}) {
  const current = visitor.status as VisitorStatus
  const options: VisitorStatus[] = ["Visiting", "Checked Out"]
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Change status for ${visitor.name}`}
              className="inline-flex items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <Badge
                variant={visitorStatusVariant[current]}
                className="whitespace-nowrap"
              >
                {current}
              </Badge>
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Change status</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wider">
          Set status
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((s) => (
          <DropdownMenuItem
            key={s}
            onSelect={(e) => {
              e.preventDefault()
              if (s !== current) onChange(s)
            }}
            disabled={s === current}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                s === current
                  ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)]"
              }`}
            >
              {s === current ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
              )}
            </span>
            {s}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function VisitorPaymentDropdown({
  visitor,
  onChange,
}: {
  visitor: Visitor
  onChange: (p: PaymentStatus) => void
}) {
  const current = visitor.paymentStatus as PaymentStatus
  // Exclude "Partially Paid" per UX — it's a transitional state, not a
  // category managers filter on.
  const options: PaymentStatus[] = ["Paid", "Pending", "Outstanding"]
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Change payment for ${visitor.name}`}
              className="inline-flex items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <Badge
                variant={paymentStatusVariant[current]}
                className="whitespace-nowrap"
              >
                {current}
              </Badge>
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Change payment</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wider">
          Set payment
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((p) => (
          <DropdownMenuItem
            key={p}
            onSelect={(e) => {
              e.preventDefault()
              if (p !== current) onChange(p)
            }}
            disabled={p === current}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                p === current
                  ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)]"
              }`}
            >
              {p === current ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
              )}
            </span>
            {p}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
