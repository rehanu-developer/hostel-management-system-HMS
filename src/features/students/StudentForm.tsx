import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { studentSchema, type StudentFormValues } from "@/lib/schemas"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
import { getVacantBedsInRoom } from "@/stores/dataStore"
import type { Hostel, Room, Student, StudentStatus } from "@/types"

interface StudentFormProps {
  defaultValues?: Partial<Student>
  hostels: Hostel[]
  rooms: Room[]
  students: Student[]
  excludeStudentId?: string // when editing, exclude the student from "occupied beds" calc
  onSubmit: (values: StudentFormValues) => void
  onCancel: () => void
  submitLabel?: string
  isSubmitting?: boolean
  onDirtyChange?: (dirty: boolean) => void
}

export function StudentForm({
  defaultValues,
  hostels,
  rooms,
  students,
  excludeStudentId,
  onSubmit,
  onCancel,
  submitLabel = "Add Student",
  isSubmitting: isSubmittingProp,
  onDirtyChange,
}: StudentFormProps) {
  const [internalSubmitting, setInternalSubmitting] = useState(false)
  const isSubmitting = isSubmittingProp ?? internalSubmitting
  const today = new Date().toISOString().slice(0, 10)

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    mode: "onTouched",
    defaultValues: {
      studentCode: defaultValues?.studentCode ?? "",
      name: defaultValues?.name ?? "",
      phone: defaultValues?.phone ?? "",
      email: defaultValues?.email ?? "",
      cnic: defaultValues?.cnic ?? "",
      address: defaultValues?.address ?? "",
      bio: defaultValues?.bio ?? "",
      status: (defaultValues?.status as StudentStatus) ?? "Active",
      hostelId: defaultValues?.hostelId ?? "",
      roomId: defaultValues?.roomId ?? "",
      bedLabel: defaultValues?.bedLabel ?? "",
      checkIn: defaultValues?.checkIn ?? today,
      checkOut: defaultValues?.checkOut,
      referencePerson: defaultValues?.referencePerson ?? "",
      familyMember: defaultValues?.familyMember ?? null,
      notes: defaultValues?.notes ?? "",
    },
  })

  // Watch fields for cascading selects
  const watchedHostel = form.watch("hostelId")
  const watchedRoom = form.watch("roomId")
  const watchedStatus = form.watch("status")
  const hasGuardian = form.watch("familyMember") !== null

  // Notify parent of dirty state for unsaved-changes guard
  const isDirty = form.formState.isDirty
  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  useEffect(() => {
    if (watchedHostel) {
      // Reset room/bed when hostel changes
      const currentRoomHostel = rooms.find((r) => r.id === form.getValues("roomId"))?.hostelId
      if (currentRoomHostel !== watchedHostel) {
        form.setValue("roomId", "")
        form.setValue("bedLabel", "")
      }
    }
  }, [watchedHostel, rooms, form])

  useEffect(() => {
    // Reset bed when room changes
    if (watchedRoom !== rooms.find((r) => r.id === form.getValues("roomId"))?.id) {
      form.setValue("bedLabel", "")
    }
  }, [watchedRoom, rooms, form])

  const hostelRooms = useMemo(
    () => rooms.filter((r) => r.hostelId === watchedHostel),
    [rooms, watchedHostel],
  )

  const selectedRoom = rooms.find((r) => r.id === watchedRoom)

  const vacantBeds = useMemo(() => {
    if (!selectedRoom) return []
    const otherStudents = excludeStudentId
      ? students.filter((s) => s.id !== excludeStudentId)
      : students
    return getVacantBedsInRoom(otherStudents, selectedRoom)
  }, [selectedRoom, students, excludeStudentId])

  // When editing, the student's current bed is always available to keep
  const availableBeds = useMemo(() => {
    if (!selectedRoom) return []
    const beds: string[] = []
    for (let i = 0; i < selectedRoom.capacity; i++) {
      beds.push(String.fromCharCode(65 + i))
    }
    const finalBeds = beds.filter(
      (b) => vacantBeds.includes(b) || b === defaultValues?.bedLabel,
    )
    return finalBeds
  }, [selectedRoom, vacantBeds, defaultValues?.bedLabel])

  const handleFormSubmit = form.handleSubmit(async (values) => {
    if (isSubmittingProp) {
      // Parent manages submitting state
      onSubmit(values)
      return
    }
    setInternalSubmitting(true)
    // Brief delay so the spinner is perceptible even on instant mock-data saves
    await new Promise((resolve) => setTimeout(resolve, 350))
    onSubmit(values)
    setInternalSubmitting(false)
  })

  return (
    <Form {...form}>
      <form
        onSubmit={handleFormSubmit}
        className="flex h-full flex-col"
      >
        <div className="flex-1 space-y-6 overflow-y-auto px-1 pr-3">
          {/* Personal Information */}
          <section className="space-y-3">
            <div>
              <h3 className="font-display text-sm font-semibold">
                Personal Information
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Basic details about the student.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="studentCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Student ID</FormLabel>
                    <FormControl>
                      <Input placeholder="STU-1042" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="Ahmed Khan" {...field} />
                    </FormControl>
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>From (city)</FormLabel>
                    <FormControl>
                      <Input placeholder="Lahore" {...field} />
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
                    <FormLabel required>CNIC</FormLabel>
                    <FormControl>
                      <Input placeholder="35202-1234567-1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel optional>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="House 12, Street 4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel optional>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="Any additional notes..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Guardian / family */}
            <div className="space-y-2 rounded-md border border-[var(--border)] bg-[var(--muted)]/30 p-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="has-guardian"
                  checked={hasGuardian}
                  onCheckedChange={(checked) => {
                    form.setValue(
                      "familyMember",
                      checked
                        ? { name: "", phone: "", cnic: "", relation: "" }
                        : null,
                    )
                  }}
                />
                <Label htmlFor="has-guardian" className="text-sm font-medium">
                  Add guardian / family contact
                </Label>
              </div>
              {hasGuardian && (
                <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="familyMember.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Guardian name</FormLabel>
                        <FormControl>
                          <Input placeholder="Rashid Khan" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="familyMember.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Guardian phone</FormLabel>
                        <FormControl>
                          <Input placeholder="0300-7654321" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="familyMember.cnic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Guardian CNIC</FormLabel>
                        <FormControl>
                          <Input placeholder="35202-7654321-2" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="familyMember.relation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Relation</FormLabel>
                        <FormControl>
                          <Input placeholder="Father" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
          </section>

          {/* Hostel Information */}
          <section className="space-y-3">
            <div>
              <h3 className="font-display text-sm font-semibold">
                Hostel Information
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Assign the student to a hostel, room and bed.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="hostelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Hostel</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select hostel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {hostels.map((h) => (
                          <SelectItem key={h.id} value={h.id}>
                            {h.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Room</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!watchedHostel}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue
                            placeholder={
                              watchedHostel
                              ? "Select room"
                              : "Select hostel first"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {hostelRooms.length === 0 ? (
                          <div className="px-2 py-1.5 text-xs text-[var(--muted-foreground)]">
                            No rooms in this hostel
                          </div>
                        ) : (
                          hostelRooms.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              Room {r.number} · {r.capacity} beds
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bedLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Bed</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!watchedRoom}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue
                            placeholder={
                              watchedRoom ? "Select bed" : "Select room first"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableBeds.length === 0 ? (
                          <div className="px-2 py-1.5 text-xs text-[var(--muted-foreground)]">
                            No vacant beds
                          </div>
                        ) : (
                          availableBeds.map((b) => (
                            <SelectItem key={b} value={b}>
                              Bed {b}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="checkIn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Check-in date</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(d) =>
                          field.onChange(d ? d.toISOString().slice(0, 10) : "")
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="referencePerson"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel optional>Reference person</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Father, Uncle" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* Status */}
          <section className="space-y-3">
            <div>
              <h3 className="font-display text-sm font-semibold">Status</h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Newly admitted students start as Active. You can change the
                status later.
              </p>
            </div>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current status</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9 w-full sm:w-[260px]">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Left">Left</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {watchedStatus === "Left" && (
                    <FormDescription>
                      Setting status to Left will free the assigned bed for
                        new students.
                    </FormDescription>
                  )}
                </FormItem>
              )}
            />
          </section>
        </div>

        <div className="sticky bottom-0 -mx-1 mt-4 flex items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--background)] px-1 pt-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" isSubmitting={isSubmitting}>
            {isSubmitting ? `${submitLabel.replace(/Add |Save /, "")}…` : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}
