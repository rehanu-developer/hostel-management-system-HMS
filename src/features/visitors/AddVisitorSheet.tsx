import { useEffect, useMemo, useState } from "react"
import { Search, UserPlus } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { visitorSchema, type VisitorFormValues } from "@/lib/schemas"
import { useDataStore } from "@/stores/dataStore"
import { cn, formatCurrency } from "@/lib/utils"
import type { Hostel, Room, Student } from "@/types"
import { useSheetCloseGuard } from "@/features/students/useSheetCloseGuard.tsx"

interface AddVisitorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  hostels: Hostel[]
  rooms: Room[]
  students: Student[]
  onConfirm: (values: VisitorFormValues) => void
}

const defaultFormValues = (): VisitorFormValues => ({
  name: "",
  phone: "",
  cnic: "",
  kind: "linked",
  studentId: "",
  hostelId: "",
  relationship: null,
  checkIn: new Date().toISOString().slice(0, 16),
  expectedCheckOut: new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16),
  nights: 1,
  perNight: 1500,
  notes: "",
})

export function AddVisitorSheet({
  open,
  onOpenChange,
  hostels,
  rooms,
  students,
  onConfirm,
}: AddVisitorSheetProps) {
  const settings = useDataStore((s) => s.settings)
  const [search, setSearch] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedHostelId, setSelectedHostelId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const { handleOpenChange, GuardDialog } = useSheetCloseGuard({
    open,
    onOpenChange,
    isDirty,
  })

  const form = useForm<VisitorFormValues>({
    resolver: zodResolver(visitorSchema),
    mode: "onTouched",
    defaultValues: defaultFormValues(),
  })

  useEffect(() => {
    if (!open) return
    setSearch("")
    setSelectedStudent(null)
    setSelectedHostelId("")
    form.reset(defaultFormValues())
  }, [open, form])

  // Notify parent of dirty state for unsaved-changes guard
  useEffect(() => {
    if (!form) return
    const sub = form.watch(() => setIsDirty(form.formState.isDirty))
    setIsDirty(form.formState.isDirty)
    return () => sub.unsubscribe()
  }, [form])

  const kind = form.watch("kind")

  const assignableStudents = useMemo(() => {
    const base = students.filter((s) => s.status === "Active")
    if (!search.trim()) return base.slice(0, 50)
    const q = search.toLowerCase()
    return base.filter((s) => {
      const hay = [
        s.name,
        s.studentCode,
        s.phone,
        s.bio,
        rooms.find((r) => r.id === s.roomId)?.number ?? "",
        hostels.find((h) => h.id === s.hostelId)?.name ?? "",
      ]
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })
  }, [students, search, hostels, rooms])

  const selectedHostel = hostels.find((h) => h.id === selectedStudent?.hostelId)
  const selectedRoom = rooms.find((r) => r.id === selectedStudent?.roomId)

  // When kind changes, reset dependent state
  useEffect(() => {
    if (kind === "independent") {
      setSelectedStudent(null)
      form.setValue("studentId", undefined, { shouldValidate: false })
    } else {
      if (selectedStudent) {
        form.setValue("studentId", selectedStudent.id, { shouldValidate: false })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind])

  // Sync studentId/hostelId into form when picked
  useEffect(() => {
    if (kind === "linked" && selectedStudent) {
      form.setValue("studentId", selectedStudent.id, { shouldValidate: false })
      form.setValue("hostelId", selectedStudent.hostelId, { shouldValidate: false })
    }
  }, [selectedStudent, form, kind])

  useEffect(() => {
    if (kind === "independent") {
      form.setValue("hostelId", selectedHostelId, { shouldValidate: false })
    }
  }, [selectedHostelId, form, kind])

  // Auto-recompute nights when check-in/out change
  const checkInVal = form.watch("checkIn")
  const checkOutVal = form.watch("expectedCheckOut")
  useEffect(() => {
    if (!checkInVal || !checkOutVal) return
    const a = new Date(checkInVal).getTime()
    const b = new Date(checkOutVal).getTime()
    if (!isNaN(a) && !isNaN(b) && b > a) {
      const days = Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)))
      form.setValue("nights", days, { shouldValidate: false })
    }
  }, [checkInVal, checkOutVal, form])

  const total = (form.watch("perNight") ?? 0) * (form.watch("nights") ?? 0)

  const canSubmit =
    (kind === "linked" ? !!selectedStudent : selectedHostelId !== "")

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 350))
    if (values.kind === "linked" && !selectedStudent) {
      setIsSubmitting(false)
      return
    }
    if (values.kind === "independent" && !selectedHostelId) {
      setIsSubmitting(false)
      return
    }
    onConfirm({
      ...values,
      studentId:
        values.kind === "linked" ? selectedStudent?.id : undefined,
      hostelId:
        values.kind === "linked"
          ? (selectedStudent?.hostelId ?? "")
          : selectedHostelId,
    })
    setIsSubmitting(false)
    onOpenChange(false)
  })

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 sm:max-w-xl"
        >
          <SheetHeader className="border-b border-[var(--border)] pb-4">
            <SheetTitle>Add Visitor</SheetTitle>
            <SheetDescription>
              Record a new visitor. Linked visitors are tied to a hostel
              member; independent visitors pay their own stay.
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form
              onSubmit={handleSubmit}
              className="flex h-full flex-col"
              id="add-visitor-form"
            >
              <div className="flex-1 space-y-6 overflow-y-auto px-1 py-5">
                {/* Visitor type */}
                <section className="space-y-3">
                  <Label className="text-sm font-medium">Visitor Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => form.setValue("kind", "linked", { shouldValidate: false })}
                      className={cn(
                        "rounded-md border px-3 py-2.5 text-left transition",
                        kind === "linked"
                          ? "border-[var(--primary)] bg-[var(--primary)]/10"
                          : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--accent)]",
                      )}
                    >
                      <div className="text-sm font-medium">Linked to Student</div>
                      <div className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                        Assigned to a hostel member; charges that student
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => form.setValue("kind", "independent", { shouldValidate: false })}
                      className={cn(
                        "rounded-md border px-3 py-2.5 text-left transition",
                        kind === "independent"
                          ? "border-[var(--primary)] bg-[var(--primary)]/10"
                          : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--accent)]",
                      )}
                    >
                      <div className="text-sm font-medium">Independent Visitor</div>
                      <div className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                        Walk-in guest; pays their own stay
                      </div>
                    </button>
                  </div>
                </section>

                {/* Step 1: Pick hostel member (linked) or hostel (independent) */}
                {kind === "linked" ? (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        Visiting Student
                      </Label>
                      {selectedStudent && (
                        <button
                          type="button"
                          className="text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          onClick={() => setSelectedStudent(null)}
                        >
                          Change
                        </button>
                      )}
                    </div>
                    {selectedStudent ? (
                      <SelectedStudentCard
                        student={selectedStudent}
                        hostelName={selectedHostel?.name}
                        roomNumber={selectedRoom?.number}
                      />
                    ) : (
                      <>
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
                          <Input
                            placeholder="Search students..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9 pl-8"
                            aria-label="Search students"
                          />
                        </div>
                        <div className="max-h-72 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--card)]">
                          {assignableStudents.length === 0 ? (
                            <p className="p-4 text-center text-sm text-[var(--muted-foreground)]">
                              No matching students
                            </p>
                          ) : (
                            <ul className="divide-y divide-[var(--border)]">
                              {assignableStudents.map((s) => (
                                <li key={s.id}>
                                  <button
                                    type="button"
                                    className={cn(
                                      "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-[var(--accent)]",
                                    )}
                                    onClick={() => setSelectedStudent(s)}
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate font-medium">
                                        {s.name}
                                      </p>
                                      <p className="truncate text-xs text-[var(--muted-foreground)]">
                                        {s.studentCode} · {s.bio}
                                      </p>
                                    </div>
                                    <div className="shrink-0 text-right text-xs text-[var(--muted-foreground)]">
                                      {hostels.find((h) => h.id === s.hostelId)?.name}
                                    </div>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </>
                    )}
                    <FormMessage>
                      {form.formState.errors.studentId?.message}
                    </FormMessage>
                  </section>
                ) : (
                  <section className="space-y-3">
                    <Label className="text-sm font-medium">Hostel</Label>
                    <Select
                      value={selectedHostelId}
                      onValueChange={setSelectedHostelId}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select hostel for the stay" />
                      </SelectTrigger>
                      <SelectContent>
                        {hostels.map((h) => (
                          <SelectItem key={h.id} value={h.id}>
                            {h.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-[var(--muted-foreground)]">
                      Independent visitors are financially responsible for
                      their own stay — no student will be charged.
                    </p>
                  </section>
                )}

                {/* Step 2: Visitor info */}
                <section className="space-y-3">
                  <Label className="text-sm font-medium">
                    Visitor Information
                  </Label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Visitor Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Rashid Khan" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="relationship"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Relationship</FormLabel>
                          <Select
                            value={field.value ?? "Friend"}
                            onValueChange={(v) =>
                              field.onChange(v as VisitorFormValues["relationship"])
                            }
                          >
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Friend">Friend</SelectItem>
                              <SelectItem value="Family Member">
                                Family Member
                              </SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="0300-1234567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cnic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>CNIC / ID</FormLabel>
                          <FormControl>
                            <Input placeholder="35202-1234567-1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                {/* Step 3: Stay details */}
                <section className="space-y-3">
                  <Label className="text-sm font-medium">Stay Details</Label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="checkIn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Check-in</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="expectedCheckOut"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Expected Check-out</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nights"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Nights</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              step={1}
                              className="h-9"
                              value={field.value}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ""
                                    ? 1
                                    : Number(e.target.value),
                                )
                              }
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="perNight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Price / Night</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--muted-foreground)]">
                                {settings.currency}
                              </span>
                              <Input
                                type="number"
                                min={0}
                                step={500}
                                className="h-9 pl-12"
                                value={field.value}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? 0
                                      : Number(e.target.value),
                                  )
                                }
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="rounded-md border border-[var(--border)] bg-[var(--muted)]/30 p-3">
                    <div className="flex items-baseline justify-between">
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Total Stay
                      </p>
                      <p className="font-display text-base font-semibold tabular-nums">
                        {formatCurrency(total, settings.currency)}
                      </p>
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                      {form.watch("nights") ?? 0} night
                      {(form.watch("nights") ?? 0) === 1 ? "" : "s"} ×{" "}
                      {formatCurrency(form.watch("perNight") ?? 0, settings.currency)}
                    </p>
                  </div>
                </section>
              </div>

              <SheetFooter className="border-t border-[var(--border)] px-1 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  isSubmitting={isSubmitting}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {isSubmitting ? "Checking in…" : "Check In Visitor"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
      {GuardDialog}
    </>
  )
}

function SelectedStudentCard({
  student,
  hostelName,
  roomNumber,
}: {
  student: Student
  hostelName?: string
  roomNumber?: string
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{student.name}</p>
          <p className="truncate text-xs text-[var(--muted-foreground)]">
            {student.studentCode}
          </p>
        </div>
        <Badge variant="success-soft">Active</Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-3 text-xs">
        <div>
          <p className="text-[var(--muted-foreground)]">Hostel</p>
          <p className="font-medium">{hostelName ?? "—"}</p>
        </div>
        <div>
          <p className="text-[var(--muted-foreground)]">Room / Bed</p>
          <p className="font-medium">
            Room {roomNumber ?? "—"} · Bed {student.bedLabel}
          </p>
        </div>
      </div>
    </div>
  )
}
