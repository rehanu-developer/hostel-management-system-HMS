import { useNavigate, useParams } from "react-router-dom"
import { useState } from "react"
import { toast } from "sonner"
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  MapPin,
  IdCard,
  User,
  Trash2,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteStudentDialog } from "./DeleteStudentDialog"
import {
  studentStatusLabel,
  studentStatusVariant,
  paymentStatusVariant,
} from "./studentStatus"
import { useDataStore, getStudentsInRoom } from "@/stores/dataStore"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { StudentStatus, PaymentStatus, Payment } from "@/types"

interface StudentProfileProps {
  onEdit: (studentId: string) => void
}

export function StudentProfile({ onEdit }: StudentProfileProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const students = useDataStore((s) => s.students)
  const hostels = useDataStore((s) => s.hostels)
  const rooms = useDataStore((s) => s.rooms)
  const payments = useDataStore((s) => s.payments)
  const roomHistory = useDataStore((s) => s.roomHistory)
  const currency = useDataStore((s) => s.settings.currency)
  const deleteStudent = useDataStore((s) => s.deleteStudent)
  const setPaymentStatus = useDataStore((s) => s.setPaymentStatus)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const student = students.find((s) => s.id === id)

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <p className="text-sm text-[var(--muted-foreground)]">
          Student not found.
        </p>
        <Button variant="outline" onClick={() => navigate("/students")}>
          Back to students
        </Button>
      </div>
    )
  }

  const hostel = hostels.find((h) => h.id === student.hostelId)
  const room = rooms.find((r) => r.id === student.roomId)
  const roommates = room ? getStudentsInRoom(students, room.id) : []
  const history = roomHistory.filter((h) => h.studentId === student.id)
  const studentPayments = payments
    .filter((p) => p.studentId === student.id)
    .sort((a, b) => (a.month < b.month ? 1 : -1))

  const totalPaid = studentPayments.reduce(
    (sum, p) => sum + (p.paid ?? 0),
    0,
  )
  const outstanding = studentPayments.reduce(
    (sum, p) => sum + Math.max(0, p.amount - (p.paid ?? 0)),
    0,
  )

  return (
    <>
      {/* Sub-header */}
      <div className="flex flex-col gap-3 border-b border-[var(--border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/students")}
            className="-ml-2 gap-1.5 text-[var(--muted-foreground)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Students
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-semibold tracking-tight">
                {student.name}
              </h1>
              <Badge variant={studentStatusVariant[student.status as StudentStatus]}>
                {studentStatusLabel[student.status as StudentStatus]}
              </Badge>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              {student.studentCode}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-[var(--destructive)]"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
          <Button onClick={() => onEdit(student.id)} size="sm">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
      </div>

      <div className="space-y-6 p-4 lg:p-6">
        {/* Quick info card */}
        <Card>
          <CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem icon={User} label="From" value={student.bio} />
            <InfoItem icon={Phone} label="Phone" value={student.phone} />
            <InfoItem icon={Mail} label="Email" value={student.email || "—"} />
            <InfoItem
              icon={IdCard}
              label="CNIC"
              value={student.cnic}
            />
          </CardContent>
        </Card>

        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList>
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="hostel">Hostel & Room</TabsTrigger>
            <TabsTrigger value="history">Room History</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          {/* Personal */}
          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailRow label="Student ID" value={student.studentCode} />
                <DetailRow label="Full Name" value={student.name} />
                <DetailRow label="Phone" value={student.phone} />
                <DetailRow
                  label="Email"
                  value={student.email || "—"}
                />
                <DetailRow label="CNIC" value={student.cnic} />
                <DetailRow label="From" value={student.bio} />
                <DetailRow
                  label="Address"
                  value={student.address || "—"}
                  className="sm:col-span-2"
                />
                <DetailRow
                  label="Reference Person"
                  value={student.referencePerson || "—"}
                />
                <DetailRow
                  label="Notes"
                  value={student.notes || "—"}
                  className="sm:col-span-2"
                />
              </CardContent>
            </Card>

            {student.guardians.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Guardian / Family
                    <span className="ml-2 text-xs font-normal text-[var(--muted-foreground)]">
                      {student.guardians.length}{" "}
                      contact{student.guardians.length === 1 ? "" : "s"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {student.guardians.map((g, idx) => (
                    <div
                      key={`${g.name}-${idx}`}
                      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                    >
                      <DetailRow
                        label={`Guardian ${idx + 1} · Name`}
                        value={g.name}
                      />
                      <DetailRow label="Relation" value={g.relation} />
                      <DetailRow label="Phone" value={g.phone} />
                      <DetailRow label="CNIC" value={g.cnic} />
                      {idx < student.guardians.length - 1 && (
                        <Separator className="sm:col-span-2" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Hostel & Room */}
          <TabsContent value="hostel" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Accommodation</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailRow label="Hostel" value={hostel?.name ?? "—"} />
                <DetailRow
                  label="Location"
                  value={hostel?.location ?? "—"}
                />
                <DetailRow
                  label="Room"
                  value={room ? `Room ${room.number}` : "Unassigned"}
                />
                <DetailRow
                  label="Bed"
                  value={student.bedLabel ? `Bed ${student.bedLabel}` : "—"}
                />
                <DetailRow
                  label="Check-in"
                  value={formatDate(student.checkIn)}
                />
                <DetailRow
                  label="Check-out"
                  value={
                    student.checkOut ? formatDate(student.checkOut) : "—"
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Roommates</CardTitle>
              </CardHeader>
              <CardContent>
                {roommates.length === 0 ? (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    No active roommates.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {roommates.map((rm) => (
                      <li
                        key={rm.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                        {rm.name}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Room History */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Room History</CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    No previous rooms recorded.
                  </p>
                ) : (
                  <ol className="relative space-y-3 border-l border-[var(--border)] pl-5">
                    {history.map((h) => {
                      const hRoom = rooms.find((r) => r.id === h.roomId)
                      const hHostel = hostels.find(
                        (ho) => ho.id === h.hostelId,
                      )
                      return (
                        <li key={h.id} className="relative">
                          <span className="absolute -left-[26px] top-1 h-2 w-2 rounded-full bg-[var(--primary)]" />
                          <p className="text-sm font-medium">
                            {hHostel?.name ?? "Hostel"} · Room{" "}
                            {hRoom?.number ?? "—"} · Bed {h.bedLabel}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {formatDate(h.from)} —{" "}
                            {h.to ? formatDate(h.to) : "Present"}
                          </p>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments */}
          <TabsContent value="payments" className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SummaryCard
                label="Total Paid"
                value={formatCurrency(totalPaid, currency)}
                tone="success"
              />
              <SummaryCard
                label="Outstanding"
                value={formatCurrency(outstanding, currency)}
                tone={outstanding > 0 ? "warning" : "muted"}
              />
              <SummaryCard
                label="Records"
                value={String(studentPayments.length)}
                tone="muted"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {studentPayments.length === 0 ? (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    No payment records.
                  </p>
                ) : (
                  <ul className="divide-y divide-[var(--border)]">
                    {studentPayments.map((p) => (
                      <PaymentHistoryRow
                        key={p.id}
                        payment={p}
                        currency={currency}
                        onChangeStatus={(next) => {
                          setPaymentStatus(p.id, next as PaymentStatus)
                          toast.success(
                            `${new Date(p.month + "-01").toLocaleDateString(
                              "en-GB",
                              { month: "long", year: "numeric" },
                            )} marked as ${next}`,
                          )
                        }}
                      />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <DeleteStudentDialog
        student={student}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={(s) => {
          deleteStudent(s.id)
          toast.success(`${s.name} deleted`)
          setDeleteOpen(false)
          navigate("/students")
        }}
      />
    </>
  )
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--muted)] text-[var(--muted-foreground)]">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
          {label}
        </p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

function DetailRow({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "success" | "warning" | "muted"
}) {
  const toneClass =
    tone === "success"
      ? "border-[var(--success)]/30 bg-[var(--success)]/5"
      : tone === "warning"
        ? "border-[var(--warning)]/30 bg-[var(--warning)]/5"
        : ""
  return (
    <Card className={toneClass}>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
          {label}
        </p>
        <p className="mt-1 font-display text-lg font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}

function PaymentHistoryRow({
  payment,
  currency,
  onChangeStatus,
}: {
  payment: Payment
  currency: string
  onChangeStatus: (next: PaymentStatus) => void
}) {
  const monthLabel = new Date(payment.month + "-01").toLocaleDateString(
    "en-GB",
    { month: "long", year: "numeric" },
  )
  const paid = payment.paid ?? 0
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div>
        <p className="text-sm font-medium">{monthLabel}</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          {paid > 0 && payment.paidDate
            ? `Paid on ${formatDate(payment.paidDate)}`
            : paid > 0
              ? `Paid ${formatCurrency(paid, currency)}`
              : "Not paid yet"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm tabular-nums">
          {formatCurrency(payment.amount, currency)}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Change status for ${monthLabel}`}
              className="inline-flex items-center gap-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <Badge variant={paymentStatusVariant[payment.status as PaymentStatus]}>
                {payment.status}
                <ChevronDown className="ml-1 h-3 w-3" />
              </Badge>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onSelect={() => onChangeStatus("Paid")}
              disabled={payment.status === "Paid"}
            >
              Paid
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => onChangeStatus("Partially Paid")}
              disabled={payment.status === "Partially Paid"}
            >
              Partially Paid
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => onChangeStatus("Pending")}
              disabled={payment.status === "Pending"}
            >
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => onChangeStatus("Outstanding")}
              disabled={payment.status === "Outstanding"}
            >
              Outstanding
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  )
}

export function StudentProfileSkeleton() {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}
