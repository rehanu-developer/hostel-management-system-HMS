import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle2, Loader2, Plus, Search, User } from "lucide-react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency, currentMonthKey, formatMonth } from "@/lib/utils"
import type { Hostel, Payment, Room, Student, Visitor } from "@/types"

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  students: Student[]
  hostels: Hostels
  rooms: Room[]
  visitors: Visitor[]
  payments: Payment[]
  currency: string
  onRecordStudent: (args: {
    studentId: string
    month: string
    amount: number
    paidDate: string
  }) => void
  onRecordVisitor: (args: {
    visitorId: string
    amount: number
    paidDate: string
  }) => void
}

type Hostels = Hostel[]

const baseSchema = z.object({
  paidDate: z.string().min(1, "Payment date is required"),
})

const studentSchema = baseSchema.extend({
  type: z.literal("student"),
  studentId: z.string().min(1, "Student is required"),
  month: z.string().min(1, "Billing month is required"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
})

const visitorSchema = baseSchema.extend({
  type: z.literal("visitor"),
  visitorId: z.string().min(1, "Visitor is required"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
})

type FormValues = z.infer<typeof studentSchema> | z.infer<typeof visitorSchema>

export function RecordPaymentSheet({
  open,
  onOpenChange,
  students,
  hostels,
  rooms,
  visitors,
  payments,
  currency,
  onRecordStudent,
  onRecordVisitor,
}: Props) {
  const [type, setType] = useState<"student" | "visitor">("student")
  const [submitting, setSubmitting] = useState(false)
  const [studentSearch, setStudentSearch] = useState("")
  const [visitorSearch, setVisitorSearch] = useState("")

  const form = useForm<FormValues>({
    resolver: zodResolver(type === "student" ? studentSchema : visitorSchema),
    defaultValues: {
      type,
      studentId: "",
      month: currentMonthKey(),
      amount: 0,
      paidDate: new Date().toISOString().slice(0, 10),
    } as FormValues,
    mode: "onTouched",
  })

  // Reset on open/type change
  useEffect(() => {
    if (open) {
      form.reset({
        type,
        studentId: "",
        month: currentMonthKey(),
        amount: 0,
        paidDate: new Date().toISOString().slice(0, 10),
      } as FormValues)
      setStudentSearch("")
      setVisitorSearch("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type])

  // Switch resolver + shape when type toggles
  useEffect(() => {
    if (type === "student") {
      form.reset({
        type: "student",
        studentId: "",
        month: currentMonthKey(),
        amount: 0,
        paidDate: new Date().toISOString().slice(0, 10),
      })
    } else {
      form.reset({
        type: "visitor",
        visitorId: "",
        amount: 0,
        paidDate: new Date().toISOString().slice(0, 10),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  const studentId = form.watch("studentId") as string | undefined
  const visitorId = form.watch("visitorId") as string | undefined
  const month = form.watch("month") as string | undefined

  const selectedStudent = students.find((s) => s.id === studentId)
  const selectedRoom = rooms.find((r) => r.id === selectedStudent?.roomId)
  const selectedHostel = hostels.find((h) => h.id === selectedStudent?.hostelId)

  // Total fee for the month — use the existing payment's amount if present
  // (preserves any prior negotiated price); otherwise fall back to the agreed
  // price from the open room assignment, then the room default.
  const existingPayment = payments.find(
    (p) => p.studentId === studentId && p.month === (month ?? currentMonthKey()),
  )
  const studentAgreedPrice = selectedStudent?.monthlyFee
  const expectedMonthlyFee = existingPayment?.amount
    ?? studentAgreedPrice
    ?? selectedRoom?.monthlyPrice
    ?? 0
  const alreadyPaid = existingPayment?.paid ?? 0
  const remaining = Math.max(0, expectedMonthlyFee - alreadyPaid)

  const selectedVisitor = visitors.find((v) => v.id === visitorId)
  const responsibleStudent = students.find((s) => s.id === selectedVisitor?.studentId)
  const visitorRoom = rooms.find((r) => r.id === responsibleStudent?.roomId)
  const visitorHostel = hostels.find((h) => h.id === responsibleStudent?.hostelId)

  const visitorAlreadyPaid = selectedVisitor?.paid ?? 0
  const visitorRemaining = selectedVisitor
    ? Math.max(0, selectedVisitor.total - visitorAlreadyPaid)
    : 0

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students
    const q = studentSearch.toLowerCase()
    return students.filter((s) =>
      [s.name, s.studentCode, s.phone].join(" ").toLowerCase().includes(q),
    )
  }, [students, studentSearch])

  const filteredVisitors = useMemo(() => {
    if (!visitorSearch) return visitors
    const q = visitorSearch.toLowerCase()
    return visitors.filter((v) =>
      v.name.toLowerCase().includes(q) ||
      students
        .find((s) => s.id === v.studentId)
        ?.name.toLowerCase()
        .includes(q),
    )
  }, [visitors, students, visitorSearch])

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 350))
    if (values.type === "student") {
      const v = values as z.infer<typeof studentSchema>
      if (v.amount > remaining) {
        toast.error(`Amount exceeds remaining (${formatCurrency(remaining, currency)})`)
        setSubmitting(false)
        return
      }
      onRecordStudent({
        studentId: v.studentId,
        month: v.month,
        amount: v.amount,
        paidDate: v.paidDate,
      })
    } else {
      const v = values as z.infer<typeof visitorSchema>
      if (v.amount > visitorRemaining) {
        toast.error(`Amount exceeds remaining (${formatCurrency(visitorRemaining, currency)})`)
        setSubmitting(false)
        return
      }
      onRecordVisitor({
        visitorId: v.visitorId,
        amount: v.amount,
        paidDate: v.paidDate,
      })
    }
    setSubmitting(false)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Record Payment
          </SheetTitle>
          <SheetDescription>
            Choose a payment type, then record the payment against an existing
            accommodation or visitor record.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4 pb-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Payment Type</FormLabel>
                  <Select
                    value={field.value as string}
                    onValueChange={(v) => {
                      field.onChange(v)
                      setType(v as "student" | "visitor")
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="student">Student Accommodation</SelectItem>
                      <SelectItem value="visitor">Visitor Stay</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {type === "student" ? (
              <>
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Student</FormLabel>
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
                          <Input
                            placeholder="Search by name, code or phone"
                            className="pl-9"
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                          />
                        </div>
                        <Select
                          value={field.value as string}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose student" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[220px]">
                            {filteredStudents.length === 0 ? (
                              <div className="px-3 py-4 text-center text-xs text-[var(--muted-foreground)]">
                                No students found
                              </div>
                            ) : (
                              filteredStudents.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name} ({s.studentCode})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedStudent && (
                        <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-3 text-xs">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                            <span className="font-medium">
                              {selectedStudent.name}
                            </span>
                            <Badge variant="neutral-soft" className="text-[10px]">
                              {selectedStudent.studentCode}
                            </Badge>
                          </div>
                          <div className="mt-1 text-[var(--muted-foreground)]">
                            {selectedHostel?.name} / Room {selectedRoom?.number} · Monthly fee {formatCurrency(expectedMonthlyFee, currency)}
                          </div>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Billing Month</FormLabel>
                      <Select
                        value={field.value as string}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Billing month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={currentMonthKey()}>
                            {formatMonth(currentMonthKey())} (Current)
                          </SelectItem>
                          {lastMonths(5).map((m) => (
                            <SelectItem key={m} value={m}>
                              {formatMonth(m)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <ReadOnlyField
                  label="Monthly Fee"
                  value={selectedStudent ? formatCurrency(expectedMonthlyFee, currency) : "—"}
                />

                <ReadOnlyField
                  label="Already Paid"
                  value={selectedStudent ? formatCurrency(alreadyPaid, currency) : "—"}
                />

                <ReadOnlyField
                  label="Remaining"
                  value={selectedStudent ? formatCurrency(remaining, currency) : "—"}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Amount to Pay</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted-foreground)]">
                            {currency === "PKR" ? "Rs" : currency}
                          </span>
                          <Input
                            type="number"
                            min={1}
                            placeholder="0"
                            className="pl-10"
                            value={field.value as number}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="visitorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Visitor</FormLabel>
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
                          <Input
                            placeholder="Search by visitor or responsible student name"
                            className="pl-9"
                            value={visitorSearch}
                            onChange={(e) => setVisitorSearch(e.target.value)}
                          />
                        </div>
                        <Select
                          value={field.value as string}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose visitor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[220px]">
                            {filteredVisitors.length === 0 ? (
                              <div className="px-3 py-4 text-center text-xs text-[var(--muted-foreground)]">
                                No visitors found
                              </div>
                            ) : (
                              filteredVisitors.map((v) => {
                                const stu = students.find((s) => s.id === v.studentId)
                                return (
                                  <SelectItem key={v.id} value={v.id}>
                                    {v.name} — {stu?.name ?? "—"}
                                  </SelectItem>
                                )
                              })
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedVisitor && (
                        <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-3 text-xs">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="font-medium">{selectedVisitor.name}</span>
                            <Badge
                              variant={selectedVisitor.kind === "independent" ? "warning-soft" : "info-soft"}
                              className="text-[10px]"
                            >
                              {selectedVisitor.kind === "independent" ? "Independent" : "Visitor Stay"}
                            </Badge>
                          </div>
                          <div className="mt-1 text-[var(--muted-foreground)]">
                            {selectedVisitor.kind === "independent"
                              ? `${hostels.find((h) => h.id === selectedVisitor.hostelId)?.name ?? "—"} · Self-pay (no student)`
                              : `Responsible: ${responsibleStudent?.name ?? "—"} · ${visitorHostel?.name} / Room ${visitorRoom?.number}`}
                          </div>
                          <div className="mt-1 text-[var(--muted-foreground)]">
                            Total charge: {formatCurrency(selectedVisitor.total, currency)} · Paid:{" "}
                            {formatCurrency(
                              selectedVisitor.paymentStatus === "Paid"
                                ? selectedVisitor.total
                                : selectedVisitor.paymentStatus === "Partially Paid"
                                  ? Math.round(selectedVisitor.total / 2)
                                  : 0,
                              currency,
                            )}{" "}
                            · Remaining:{" "}
                            {formatCurrency(
                              Math.max(
                                0,
                                selectedVisitor.total -
                                  (selectedVisitor.paymentStatus === "Paid"
                                    ? selectedVisitor.total
                                    : selectedVisitor.paymentStatus === "Partially Paid"
                                      ? Math.round(selectedVisitor.total / 2)
                                      : 0),
                              ),
                              currency,
                            )}
                          </div>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <ReadOnlyField
                  label="Visitor Charge"
                  value={selectedVisitor
                    ? formatCurrency(selectedVisitor.total, currency)
                    : "—"}
                />
                <ReadOnlyField
                  label="Already Paid"
                  value={selectedVisitor ? formatCurrency(visitorAlreadyPaid, currency) : "—"}
                />
                <ReadOnlyField
                  label="Remaining"
                  value={selectedVisitor ? formatCurrency(visitorRemaining, currency) : "—"}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Amount to Pay</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted-foreground)]">
                            {currency === "PKR" ? "Rs" : currency}
                          </span>
                          <Input
                            type="number"
                            min={1}
                            placeholder="0"
                            className="pl-10"
                            value={field.value as number}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="paidDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Payment Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value as string}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="px-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" isSubmitting={submitting}>
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Payment
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
        {label}
      </span>
      <div className="flex h-9 items-center rounded-md border border-[var(--border)] bg-[var(--muted)]/30 px-3 text-sm tabular-nums">
        {value}
      </div>
    </div>
  )
}

function lastMonths(n: number) {
  const out: string[] = []
  const now = new Date()
  for (let i = 1; i <= n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    out.push(key)
  }
  return out
}
