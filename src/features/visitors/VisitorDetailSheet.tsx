import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CreditCard, LogOut, Pencil } from "lucide-react"
import {
  visitorStatusVariant,
  paymentStatusVariant,
} from "@/components/ui/badgeVariants"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useDataStore } from "@/stores/dataStore"
import type {
  Hostel,
  PaymentStatus,
  Room,
  Student,
  Visitor,
} from "@/types"

interface VisitorDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  visitor: Visitor | null
  student: Student | null
  hostel?: Hostel | null
  room?: Room | null
  onCheckOut: (visitorId: string) => void
  onEdit: (visitor: Visitor) => void
}

export function VisitorDetailSheet({
  open,
  onOpenChange,
  visitor,
  student,
  hostel,
  room,
  onCheckOut,
  onEdit,
}: VisitorDetailSheetProps) {
  const settings = useDataStore((s) => s.settings)
  const recordVisitorPayment = useDataStore((s) => s.recordVisitorPayment)
  const [confirmCheckOut, setConfirmCheckOut] = useState(false)
  const [recordingPayment, setRecordingPayment] = useState(false)

  if (!visitor) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg" />
      </Sheet>
    )
  }

  const isActive = visitor.status === "Visiting"
  const amountPaid = visitor.paid ?? 0
  const outstanding = Math.max(0, visitor.total - amountPaid)

  const handleRecordPayment = async (status: PaymentStatus) => {
    setRecordingPayment(true)
    await new Promise((resolve) => setTimeout(resolve, 250))
    recordVisitorPayment(visitor.id, status)
    setRecordingPayment(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 sm:max-w-lg"
      >
        <SheetHeader className="border-b border-[var(--border)] pb-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <SheetTitle>{visitor.name}</SheetTitle>
              <SheetDescription>
                {visitor.kind === "independent"
                  ? "Independent walk-in guest — self-pay"
                  : `Visiting ${student?.name ?? "—"}. Relationship: ${visitor.relationship ?? "—"}`}
              </SheetDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge
                variant={visitor.kind === "independent" ? "warning-soft" : "info-soft"}
              >
                {visitor.kind === "independent" ? "Independent" : "Linked"}
              </Badge>
              <Badge variant={visitorStatusVariant[visitor.status]}>
                {visitor.status}
              </Badge>
              <Badge variant={paymentStatusVariant[visitor.paymentStatus]}>
                {visitor.paymentStatus}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-1 py-5">
          {/* Visitor */}
          <section className="space-y-3">
            <h3 className="font-display text-sm font-semibold">Visitor</h3>
            <div className="grid grid-cols-2 gap-3 rounded-md border border-[var(--border)] bg-[var(--card)] p-3 text-xs">
              <div>
                <p className="text-[var(--muted-foreground)]">Phone</p>
                <p className="font-medium tabular-nums">{visitor.phone}</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">CNIC / ID</p>
                <p className="font-medium tabular-nums">{visitor.cnic}</p>
              </div>
              {visitor.kind === "linked" && (
                <div className="col-span-2">
                  <p className="text-[var(--muted-foreground)]">Relationship</p>
                  <p className="font-medium">{visitor.relationship ?? "—"}</p>
                </div>
              )}
              {visitor.notes && (
                <div className="col-span-2">
                  <p className="text-[var(--muted-foreground)]">Notes</p>
                  <p className="font-medium">{visitor.notes}</p>
                </div>
              )}
            </div>
          </section>

          {/* Visiting (only for linked) */}
          {visitor.kind === "linked" && (
            <section className="space-y-3">
              <h3 className="font-display text-sm font-semibold">Visiting</h3>
              <div className="grid grid-cols-2 gap-3 rounded-md border border-[var(--border)] bg-[var(--card)] p-3 text-xs">
                <div className="col-span-2">
                  <p className="text-[var(--muted-foreground)]">Student</p>
                  <p className="font-medium">{student?.name ?? "—"}</p>
                  <p className="text-[var(--muted-foreground)]">
                    {student?.studentCode ?? ""}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--muted-foreground)]">Hostel</p>
                  <p className="font-medium">{hostel?.name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[var(--muted-foreground)]">Room / Bed</p>
                  <p className="font-medium">
                    Room {room?.number ?? "—"} · Bed {student?.bedLabel ?? "—"}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Stay (independent: just hostel) */}
          {visitor.kind === "independent" && (
            <section className="space-y-3">
              <h3 className="font-display text-sm font-semibold">Stay</h3>
              <div className="grid grid-cols-2 gap-3 rounded-md border border-[var(--border)] bg-[var(--card)] p-3 text-xs">
                <div>
                  <p className="text-[var(--muted-foreground)]">Hostel</p>
                  <p className="font-medium">{hostel?.name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[var(--muted-foreground)]">Type</p>
                  <p className="font-medium">Walk-in / Self-pay</p>
                </div>
              </div>
            </section>
          )}

          {/* Stay */}
          <section className="space-y-3">
            <h3 className="font-display text-sm font-semibold">Stay</h3>
            <div className="grid grid-cols-2 gap-3 rounded-md border border-[var(--border)] bg-[var(--card)] p-3 text-xs">
              <div>
                <p className="text-[var(--muted-foreground)]">Check-in</p>
                <p className="font-medium">{formatDate(visitor.checkIn)}</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Expected Check-out</p>
                <p className="font-medium">
                  {formatDate(visitor.expectedCheckOut)}
                </p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Actual Check-out</p>
                <p className="font-medium">
                  {visitor.actualCheckOut
                    ? formatDate(visitor.actualCheckOut)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Nights</p>
                <p className="font-medium tabular-nums">{visitor.nights}</p>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="space-y-3">
            <h3 className="font-display text-sm font-semibold">Pricing</h3>
            <div className="rounded-md border border-[var(--border)] bg-[var(--card)] p-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[var(--muted-foreground)]">Price / Night</p>
                  <p className="font-medium tabular-nums">
                    {formatCurrency(visitor.perNight, settings.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--muted-foreground)]">Total</p>
                  <p className="font-medium tabular-nums">
                    {formatCurrency(visitor.total, settings.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--muted-foreground)]">Amount paid</p>
                  <p className="font-medium tabular-nums">
                    {formatCurrency(amountPaid, settings.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--muted-foreground)]">Outstanding</p>
                  <p className="font-medium tabular-nums">
                    {formatCurrency(outstanding, settings.currency)}
                  </p>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between gap-2">
                <p className="text-[var(--muted-foreground)]">Mark as</p>
                <Select
                  value={visitor.paymentStatus}
                  onValueChange={(v) =>
                    handleRecordPayment(v as PaymentStatus)
                  }
                  disabled={recordingPayment}
                >
                  <SelectTrigger className="h-8 w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                    <SelectItem value="Outstanding">Outstanding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
        </div>

        <SheetFooter className="border-t border-[var(--border)] px-1 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onEdit(visitor)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          {isActive && !confirmCheckOut && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmCheckOut(true)}
            >
              <LogOut className="h-3.5 w-3.5" />
              Check Out
            </Button>
          )}
          {isActive && confirmCheckOut && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                onCheckOut(visitor.id)
                setConfirmCheckOut(false)
                onOpenChange(false)
              }}
            >
              Confirm Check Out
            </Button>
          )}
          <Button type="button" onClick={() => onOpenChange(false)}>
            <CreditCard className="h-3.5 w-3.5" />
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
