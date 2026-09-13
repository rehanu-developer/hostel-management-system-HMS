import { useMemo, useState } from "react"
import { Plus, Search } from "lucide-react"
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
import type { Visitor } from "@/types"

type StatusFilter = "all" | "active" | "checked"

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
        if (statusFilter === "active" && v.status !== "Currently Visiting")
          return false
        if (statusFilter === "checked" && v.status !== "Checked Out")
          return false
        return true
      })
      .sort(
        (a, b) =>
          new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime(),
      )
  }, [visitors, search, statusFilter, hostelById, roomById, studentById])

  const activeCount = visitors.filter(
    (v) => v.status === "Currently Visiting",
  ).length

  const handleConfirmAdd = (values: {
    name: string
    phone: string
    cnic: string
    studentId: string
    relationship: "Friend" | "Family Member" | "Other" | null
    checkIn: string
    expectedCheckOut: string
    nights: number
    perNight: number
    notes?: string
  }) => {
    const student = students.find((s) => s.id === values.studentId)
    const total = values.perNight * values.nights
    checkInVisitor({
      name: values.name,
      phone: values.phone,
      cnic: values.cnic,
      studentId: values.studentId,
      roomId: student?.roomId ?? "",
      relationship: values.relationship,
      checkIn: new Date(values.checkIn).toISOString(),
      expectedCheckOut: new Date(values.expectedCheckOut).toISOString(),
      nights: values.nights,
      perNight: values.perNight,
      total,
      status: "Currently Visiting",
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

  const handleEditSave = (patch: Partial<Visitor>) => {
    if (!active) return
    updateVisitor(active.id, patch)
    setActive({ ...active, ...patch })
    toast.success(`${active.name} updated`)
  }

  const activeStudent = active ? studentById.get(active.studentId) ?? null : null
  const activeHostel = activeStudent
    ? hostelById.get(activeStudent.hostelId) ?? null
    : null
  const activeRoom = activeStudent
    ? roomById.get(activeStudent.roomId) ?? null
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
                .filter((v) => v.status === "Currently Visiting")
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
              <SelectItem value="active">Currently Visiting</SelectItem>
              <SelectItem value="checked">Checked Out</SelectItem>
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
                  const stu = studentById.get(v.studentId)
                  const h = stu ? hostelById.get(stu.hostelId) : undefined
                  const r = stu ? roomById.get(stu.roomId) : undefined
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
                        {stu?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-[14px] text-[var(--muted-foreground)]">
                        {h?.name ?? "—"} / Room {r?.number ?? "—"}
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
                        <Badge
                          variant={paymentStatusVariant[v.paymentStatus]}
                        >
                          {v.paymentStatus}
                        </Badge>
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
