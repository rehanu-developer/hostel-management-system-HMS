import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Banknote,
  BedDouble,
  Building2,
  Calendar,
  ExternalLink,
  Loader2,
  Receipt,
  User,
} from "lucide-react"
import { Link } from "react-router-dom"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useDataStore } from "@/stores/dataStore"
import { formatCurrency, formatDate } from "@/lib/utils"
import { paymentStatusVariant } from "@/components/ui/badgeVariants"
import type { FinanceRow } from "./financeModel"

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  row: FinanceRow | null
  currency: string
  onRecordStudentPayment: (args: {
    studentId: string
    month: string
    amount: number
    paidDate: string
  }) => void
  onRecordVisitorPayment: (args: {
    visitorId: string
    amount: number
    paidDate: string
  }) => void
  onViewStudent: (studentId: string) => void
}

const schema = z.object({
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  paidDate: z.string().min(1, "Payment date is required"),
})

export function PaymentDetailSheet({
  open,
  onOpenChange,
  row,
  currency,
  onRecordStudentPayment,
  onRecordVisitorPayment,
  onViewStudent,
}: Props) {
  const visitors = useDataStore((s) => s.visitors)
  const visitor = row?.type === "visitor" ? visitors.find((v) => v.id === row.visitorId) : undefined
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<{ amount: number; paidDate: string }>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: 0,
      paidDate: new Date().toISOString().slice(0, 10),
    },
    mode: "onTouched",
  })

  useEffect(() => {
    if (row && open) {
      form.reset({
        amount: row.remaining,
        paidDate: new Date().toISOString().slice(0, 10),
      })
    }
  }, [row, open, form])

  if (!row) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Payment Detail</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )
  }

  const remaining = row.remaining

  const onSubmit = async (values: { amount: number; paidDate: string }) => {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 350))
    if (values.amount > remaining) {
      toast.error(`Amount exceeds remaining (${formatCurrency(remaining, currency)})`)
      setSubmitting(false)
      return
    }
    if (row.type === "accommodation") {
      onRecordStudentPayment({
        studentId: row.studentId,
        month: row.month,
        amount: values.amount,
        paidDate: values.paidDate,
      })
    } else {
      onRecordVisitorPayment({
        visitorId: row.visitorId,
        amount: values.amount,
        paidDate: values.paidDate,
      })
    }
    setSubmitting(false)
    onOpenChange(false)
  }

  const isAccommodation = row.type === "accommodation"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Payment Detail
          </SheetTitle>
          <SheetDescription>
            {isAccommodation ? "Accommodation fee record" : "Visitor stay record"} for {row.studentName}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 p-4">
          {/* Header */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base font-semibold">
                      {row.studentName}
                    </span>
                    <Badge variant={isAccommodation ? "neutral-soft" : "info-soft"}>
                      {isAccommodation ? "Accommodation" : "Visitor Stay"}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {row.hostelName}
                    </span>
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-3 w-3" />
                      Room {row.roomNumber}
                    </span>
                  </div>
                </div>
                <Link
                  to={`/students/${row.studentId}`}
                  onClick={() => onOpenChange(false)}
                  className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--muted)]/30 px-2 py-1 text-xs hover:bg-[var(--muted)]"
                >
                  View Student
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Amount card */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-3">
                <Stat
                  label={isAccommodation ? "Monthly Fee" : "Total Charge"}
                  value={formatCurrency(row.amount, currency)}
                  icon={<Banknote className="h-3.5 w-3.5" />}
                />
                <Stat
                  label="Paid"
                  value={formatCurrency(row.paid, currency)}
                  tone="text-emerald-600 dark:text-emerald-400"
                />
                <Stat
                  label="Remaining"
                  value={formatCurrency(row.remaining, currency)}
                  tone="text-amber-600 dark:text-amber-400"
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-[var(--muted-foreground)]">
                  {isAccommodation
                    ? `Billing month: ${row.description}`
                    : `Visitor: ${row.description}`}
                </span>
                <Badge variant={paymentStatusVariant[row.status]}>
                  {row.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Visitor-only details */}
          {!isAccommodation && visitor && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm font-semibold">Visitor</h3>
                    <Badge
                      variant={visitor.kind === "independent" ? "warning-soft" : "info-soft"}
                    >
                      {visitor.kind === "independent" ? "Independent" : "Linked"}
                    </Badge>
                  </div>
                  <Separator className="my-2" />
                  <Detail label="Name" value={visitor.name} />
                  <Detail label="Phone" value={visitor.phone} />
                  <Detail label="CNIC / ID" value={visitor.cnic ?? "—"} />
                  {visitor.kind === "linked" && (
                    <Detail label="Relationship" value={visitor.relationship ?? "—"} />
                  )}
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold">Stay</h3>
                  <Separator className="my-2" />
                  <Detail
                    label="Check-in"
                    value={formatDate(visitor.checkIn)}
                    icon={<Calendar className="h-3 w-3" />}
                  />
                  <Detail
                    label="Expected Check-out"
                    value={visitor.expectedCheckOut ? formatDate(visitor.expectedCheckOut) : "—"}
                  />
                  <Detail
                    label="Actual Check-out"
                    value={visitor.actualCheckOut ? formatDate(visitor.actualCheckOut) : "—"}
                  />
                  <Detail label="Nights" value={visitor.nights.toString()} />
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold">Charges</h3>
                  <Separator className="my-2" />
                  <Detail label="Price / Night" value={formatCurrency(visitor.perNight, currency)} />
                  <Detail label="Total Charge" value={formatCurrency(visitor.total, currency)} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Record payment inline */}
          {row.status !== "Paid" && (
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-3 font-display text-sm font-semibold">Record Payment</h3>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted-foreground)]">
                                {currency === "PKR" ? "Rs" : currency}
                              </span>
                              <Input
                                type="number"
                                min={1}
                                className="pl-10"
                                value={field.value}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </div>
                          </FormControl>
                          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                            Max: {formatCurrency(remaining, currency)}
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="paidDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Payment Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" isSubmitting={submitting}>
                        {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Save
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onViewStudent(row.studentId)
              }}
            >
              <User className="h-3.5 w-3.5" />
              View Student Profile
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
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

function Detail({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 text-xs">
      <span className="flex items-center gap-1 text-[var(--muted-foreground)]">
        {icon}
        {label}
      </span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  )
}
