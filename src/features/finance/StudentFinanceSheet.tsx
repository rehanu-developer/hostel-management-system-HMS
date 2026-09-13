import { useMemo, useState } from "react"
import {
  Banknote,
  BedDouble,
  Building2,
  CircleCheck,
  ExternalLink,
  IdCard,
  Receipt,
  User,
  Users,
} from "lucide-react"
import { Link } from "react-router-dom"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDataStore } from "@/stores/dataStore"
import { formatCurrency, formatMonth } from "@/lib/utils"
import {
  paymentStatusVariant,
  studentStatusVariant,
} from "@/components/ui/badgeVariants"
import type { Payment, Student, Visitor } from "@/types"

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  studentId: string | null
  currency: string
  onOpenVisitor: (visitorId: string) => void
}

export function StudentFinanceSheet({
  open,
  onOpenChange,
  studentId,
  currency,
  onOpenVisitor,
}: Props) {
  const students = useDataStore((s) => s.students)
  const hostels = useDataStore((s) => s.hostels)
  const rooms = useDataStore((s) => s.rooms)
  const payments = useDataStore((s) => s.payments)
  const visitors = useDataStore((s) => s.visitors)

  const student = students.find((s) => s.id === studentId)
  const hostel = hostels.find((h) => h.id === student?.hostelId)
  const room = rooms.find((r) => r.id === student?.roomId)
  const studentPayments = useMemo(
    () =>
      payments
        .filter((p) => p.studentId === studentId)
        .sort((a, b) => (a.month < b.month ? 1 : -1)),
    [payments, studentId],
  )
  const studentVisitors = useMemo(
    () => visitors.filter((v) => v.studentId === studentId),
    [visitors, studentId],
  )

  if (!studentId) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Nomad Finance</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Nomad Finance</SheetTitle>
          <SheetDescription>
            Complete financial record for this hostel member.
          </SheetDescription>
        </SheetHeader>

        {!student ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-5 p-4">
            {/* Header */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg font-semibold">
                        {student.name}
                      </span>
                      <Badge variant={studentStatusVariant[student.status]}>
                        {student.status}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-1">
                        <IdCard className="h-3 w-3" />
                        {student.studentCode}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {hostel?.name ?? "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <BedDouble className="h-3 w-3" />
                        Room {room?.number ?? "—"}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/students/${student.id}`}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--muted)]/30 px-2 py-1 text-xs hover:bg-[var(--muted)]"
                  >
                    View Profile
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Responsibility (accommodation + visitor charges) */}
            <MonthlyResponsibilityCard
              student={student}
              studentPayments={studentPayments}
              studentVisitors={studentVisitors}
              currency={currency}
            />

            {/* Accommodation */}
            <AccommodationCard
              student={student}
              payments={studentPayments}
              currency={currency}
            />

            {/* Visitor Payments */}
            <Card>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold">
                    Visitor Payments
                  </h3>
                  <Badge variant="info-soft" className="text-[10px]">
                    {studentVisitors.length} visitor{studentVisitors.length === 1 ? "" : "s"}
                  </Badge>
                </div>
                {studentVisitors.length === 0 ? (
                  <EmptyMini
                    icon={<Users className="h-4 w-4" />}
                    message="No guests assigned to this nomad"
                  />
                ) : (
                  <div className="space-y-2">
                    {studentVisitors.map((v) => (
                      <VisitorFinanceRow
                        key={v.id}
                        visitor={v}
                        currency={currency}
                        onOpen={() => onOpenVisitor(v.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-3 font-display text-sm font-semibold">
                  Payment History
                </h3>
                {studentPayments.length === 0 ? (
                  <EmptyMini
                    icon={<Receipt className="h-4 w-4" />}
                    message="No payment history"
                  />
                ) : (
                  <div className="space-y-2">
                    {studentPayments.map((p) => (
                      <PaymentHistoryRow
                        key={p.id}
                        payment={p}
                        currency={currency}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Visitor payment history */}
            {studentVisitors.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-3 font-display text-sm font-semibold">
                    Visitor Payment History
                  </h3>
                  <div className="space-y-2">
                    {studentVisitors.map((v) => (
                      <VisitorHistoryRow
                        key={v.id}
                        visitor={v}
                        currency={currency}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function AccommodationCard({
  student,
  payments,
  currency,
}: {
  student: Student
  payments: Payment[]
  currency: string
}) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const current = payments.find((p) => p.month === currentMonth)
  // Use existing fee amount if present; else the agreed/student.monthlyFee; else 0.
  const total = current?.amount ?? student.monthlyFee ?? 0
  const paid = current?.paid ?? 0
  const remaining = Math.max(0, total - paid)
  const status = current?.status ?? "Pending"
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold">
            Accommodation
          </h3>
          <Badge variant={paymentStatusVariant[status]}>{status}</Badge>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat
            label="Monthly Fee"
            value={formatCurrency(total, currency)}
            icon={<Banknote className="h-3.5 w-3.5" />}
          />
          <Stat
            label="Paid"
            value={formatCurrency(paid, currency)}
            tone="text-emerald-600 dark:text-emerald-400"
            icon={<CircleCheck className="h-3.5 w-3.5" />}
          />
          <Stat
            label="Remaining"
            value={formatCurrency(remaining, currency)}
            tone="text-amber-600 dark:text-amber-400"
            icon={<Banknote className="h-3.5 w-3.5" />}
          />
        </div>
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          Billing month: {formatMonth(currentMonth)}
        </p>
      </CardContent>
    </Card>
  )
}

function VisitorFinanceRow({
  visitor,
  currency,
  onOpen,
}: {
  visitor: Visitor
  currency: string
  onOpen: () => void
}) {
  const paid = visitor.paid ?? 0
  const remaining = Math.max(0, visitor.total - paid)
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-left transition hover:bg-[var(--muted)]/30"
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{visitor.name}</span>
          <Badge variant="info-soft" className="text-[10px]">
            {visitor.relationship}
          </Badge>
        </div>
        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
          {new Date(visitor.checkIn).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
          {visitor.actualCheckOut
            ? ` – ${new Date(visitor.actualCheckOut).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}`
            : " – ongoing"}
        </p>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium tabular-nums">
          {formatCurrency(visitor.total, currency)}
        </div>
        <div className="mt-0.5 flex items-center justify-end gap-1">
          <Badge variant={paymentStatusVariant[visitor.paymentStatus]} className="text-[10px]">
            {visitor.paymentStatus}
          </Badge>
        </div>
        {remaining > 0 && (
          <div className="mt-1 text-[11px] text-amber-600 tabular-nums">
            {formatCurrency(remaining, currency)} remaining
          </div>
        )}
      </div>
    </button>
  )
}

function VisitorHistoryRow({
  visitor,
  currency,
}: {
  visitor: Visitor
  currency: string
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-[var(--border)]/60 px-3 py-2 text-xs">
      <div>
        <span className="font-medium">{visitor.name}</span>
        <span className="ml-2 text-[var(--muted-foreground)]">
          {new Date(visitor.checkIn).toLocaleDateString("en-GB")}
          {visitor.actualCheckOut
            ? ` → ${new Date(visitor.actualCheckOut).toLocaleDateString("en-GB")}`
            : ""}
        </span>
      </div>
      <div className="text-right tabular-nums">
        <div>{formatCurrency(visitor.total, currency)}</div>
        <Badge variant={paymentStatusVariant[visitor.paymentStatus]} className="mt-0.5 text-[10px]">
          {visitor.paymentStatus}
        </Badge>
      </div>
    </div>
  )
}

function MonthlyResponsibilityCard({
  student,
  studentPayments,
  studentVisitors,
  currency,
}: {
  student: Student
  studentPayments: Payment[]
  studentVisitors: Visitor[]
  currency: string
}) {
  const currentMonth = currentMonthKey()

  // Accommodation: current month's fee
  const currentAccommodation = studentPayments.find(
    (p) => p.month === currentMonth,
  )
  const accommodationFee = currentAccommodation?.amount ?? 0
  const accommodationPaid = currentAccommodation
    ? (currentAccommodation.paid ??
        (currentAccommodation.status === "Paid"
          ? currentAccommodation.amount
          : currentAccommodation.status === "Partially Paid"
            ? Math.round(currentAccommodation.amount / 2)
            : 0))
    : 0

  // Guest charges for the current month — linked visitors whose stay overlaps
  // the current month. A visitor with fromDate in the current month is counted
  // because their charge is billed that month.
  const linkedVisitorsCurrent = studentVisitors.filter(
    (v) => v.fromDate.startsWith(currentMonth),
  )
  const visitorCharges = linkedVisitorsCurrent.reduce((sum, v) => {
    if (v.status === "Paid") return sum + v.charge
    if (v.status === "Partially Paid") return sum + v.charge
    return sum + v.charge
  }, 0)
  const visitorPaid = linkedVisitorsCurrent.reduce((sum, v) => {
    return (
      sum +
      (v.paid ??
        (v.status === "Paid"
          ? v.charge
          : v.status === "Partially Paid"
            ? Math.round(v.charge / 2)
            : 0))
    )
  }, 0)

  const totalBill = accommodationFee + visitorCharges
  const totalPaid = accommodationPaid + visitorPaid
  const totalRemaining = Math.max(totalBill - totalPaid, 0)
  const allSettled =
    totalBill > 0 &&
    totalPaid >= totalBill &&
    (currentAccommodation !== undefined || linkedVisitorsCurrent.length > 0)

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold">
            Monthly Responsibility
          </h3>
          <span className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">
            {formatMonth(currentMonth)}
          </span>
        </div>

        {totalBill === 0 ? (
          <p className="text-xs text-[var(--muted-foreground)]">
            No charges recorded for this month.
          </p>
        ) : (
          <>
            <div className="space-y-2 border-b border-[var(--border)] pb-3 text-sm">
              <Row
                label="Accommodation"
                sublabel={`${student.studentCode}`}
                value={formatCurrency(accommodationFee, currency)}
              />
              {linkedVisitorsCurrent.length > 0 && (
                <Row
                  label="Guest charges"
                  sublabel={`${linkedVisitorsCurrent.length} ${
                    linkedVisitorsCurrent.length === 1 ? "guest" : "guests"
                  } this month`}
                  value={formatCurrency(visitorCharges, currency)}
                />
              )}
            </div>

            <div className="space-y-2 pt-3 text-sm">
              <Row
                label="Total bill"
                value={
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(totalBill, currency)}
                  </span>
                }
                bold
              />
              <Row
                label="Paid"
                value={
                  <span className="tabular-nums text-[var(--muted-foreground)]">
                    {formatCurrency(totalPaid, currency)}
                  </span>
                }
              />
              <Row
                label={totalRemaining > 0 ? "Remaining" : "Settled"}
                value={
                  <span
                    className={
                      allSettled
                        ? "font-semibold tabular-nums text-[var(--success)]"
                        : "font-semibold tabular-nums"
                    }
                  >
                    {formatCurrency(totalRemaining, currency)}
                  </span>
                }
              />
            </div>

            {!currentAccommodation && linkedVisitorsCurrent.length > 0 && (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-[var(--warning-soft)]/40 bg-[var(--warning-soft)]/10 px-3 py-2 text-xs text-[var(--foreground)]">
                <span>
                  The student is responsible for settling the guest charges
                  along with their monthly fee.
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function Row({
  label,
  sublabel,
  value,
  bold,
}: {
  label: string
  sublabel?: string
  value: React.ReactNode
  bold?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <div
          className={
            bold
              ? "text-[13px] font-medium text-[var(--foreground)]"
              : "text-[13px] text-[var(--foreground)]"
          }
        >
          {label}
        </div>
        {sublabel && (
          <div className="text-[11px] text-[var(--muted-foreground)]">
            {sublabel}
          </div>
        )}
      </div>
      <div className="text-[13px]">{value}</div>
    </div>
  )
}

function PaymentHistoryRow({
  payment,
  currency,
}: {
  payment: Payment
  currency: string
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-[var(--border)] px-3 py-2 text-xs">
      <div>
        <div className="font-medium">{formatMonth(payment.month)}</div>
        <div className="text-[var(--muted-foreground)]">
          {payment.paidDate
            ? new Date(payment.paidDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "No payment date"}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="tabular-nums">{formatCurrency(payment.amount, currency)}</span>
        <Badge variant={paymentStatusVariant[payment.status]} className="text-[10px]">
          {payment.status}
        </Badge>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
  icon,
}: {
  label: string
  value: string
  tone?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-3">
      <div className="flex items-center gap-1 text-[11px] font-medium text-[var(--muted-foreground)]">
        {icon}
        {label}
      </div>
      <div className={`mt-1 font-display text-base font-semibold tabular-nums ${tone ?? ""}`}>
        {value}
      </div>
    </div>
  )
}

function EmptyMini({
  icon,
  message,
}: {
  icon: React.ReactNode
  message: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed border-[var(--border)] px-3 py-3 text-xs text-[var(--muted-foreground)]">
      <User className="h-3.5 w-3.5" />
      {message}
    </div>
  )
}
