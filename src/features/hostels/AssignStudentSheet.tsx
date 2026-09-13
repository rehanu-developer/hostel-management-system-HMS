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
import { cn } from "@/lib/utils"
import type { Room, Student, Hostel } from "@/types"

interface AssignStudentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  room: Room | null
  hostel: Hostel | null
  students: Student[]
  hostels: Hostel[]
  rooms: Room[]
  excludeStudentId?: string
  onConfirm: (
    studentId: string,
    hostelId: string,
    roomId: string,
    bedLabel: string,
    agreedMonthlyPrice?: number,
  ) => void
}

export function AssignStudentSheet({
  open,
  onOpenChange,
  room,
  hostel,
  students,
  hostels,
  rooms,
  excludeStudentId,
  onConfirm,
}: AssignStudentSheetProps) {
  const [search, setSearch] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [targetHostelId, setTargetHostelId] = useState(hostel?.id ?? "")
  const [targetRoomId, setTargetRoomId] = useState(room?.id ?? "")
  const [targetBed, setTargetBed] = useState<string>("")
  const [agreedPriceInput, setAgreedPriceInput] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset on open
  useEffect(() => {
    if (open) {
      setSearch("")
      setSelectedStudent(null)
      setTargetHostelId(hostel?.id ?? "")
      setTargetRoomId(room?.id ?? "")
      setTargetBed("")
      setAgreedPriceInput("")
    }
  }, [open, hostel?.id, room?.id])

  // Filter assignable students: Active, not Left/Suspended, and (if no specific room given) ideally unassigned
  const assignableStudents = useMemo(() => {
    const base = students.filter((s) => {
      if (s.status !== "Active") return false
      if (excludeStudentId && s.id === excludeStudentId) return false
      return true
    })
    if (!search.trim()) return base.slice(0, 50)
    const q = search.toLowerCase()
    return base.filter((s) => {
      const hay = [
        s.name,
        s.studentCode,
        s.phone,
        s.bio,
        s.address,
        s.referencePerson,
        hostels.find((h) => h.id === s.hostelId)?.name ?? "",
        rooms.find((r) => r.id === s.roomId)?.number ?? "",
      ]
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })
  }, [students, search, hostels, rooms, excludeStudentId])

  const hostelRooms = useMemo(
    () => rooms.filter((r) => r.hostelId === targetHostelId),
    [rooms, targetHostelId],
  )

  const targetRoom = rooms.find((r) => r.id === targetRoomId)

  const vacantBeds = useMemo(() => {
    if (!targetRoom) return []
    const effectiveStudents = excludeStudentId
      ? students.filter((s) => s.id !== excludeStudentId)
      : students
    const taken = new Set(
      effectiveStudents
        .filter(
          (s) => s.roomId === targetRoom.id && s.status === "Active",
        )
        .map((s) => s.bedLabel),
    )
    const result: string[] = []
    for (let i = 0; i < targetRoom.capacity; i++) {
      const label = String.fromCharCode(65 + i)
      if (!taken.has(label)) result.push(label)
    }
    return result
  }, [targetRoom, students, excludeStudentId])

  // Auto-select first available bed when room changes
  useEffect(() => {
    if (vacantBeds.length > 0 && !vacantBeds.includes(targetBed)) {
      setTargetBed(vacantBeds[0])
    } else if (vacantBeds.length === 0) {
      setTargetBed("")
    }
  }, [targetRoomId, vacantBeds, targetBed])

  // Pre-fill agreed price with the room's monthly price whenever the room
  // changes. Admin can edit the value if the negotiated price differs.
  useEffect(() => {
    if (targetRoom) {
      setAgreedPriceInput(String(targetRoom.monthlyPrice))
    }
  }, [targetRoom])

  const canConfirm =
    selectedStudent !== null &&
    targetHostelId !== "" &&
    targetRoomId !== "" &&
    targetBed !== ""

  const handleConfirm = async () => {
    if (!canConfirm || !selectedStudent) return
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 350))
    const trimmed = agreedPriceInput.trim()
    const agreedMonthlyPrice =
      trimmed === "" ? undefined : Number(trimmed)
    onConfirm(
      selectedStudent.id,
      targetHostelId,
      targetRoomId,
      targetBed,
      Number.isFinite(agreedMonthlyPrice) ? agreedMonthlyPrice : undefined,
    )
    setIsSubmitting(false)
    onOpenChange(false)
  }

  const isNegotiated =
    agreedPriceInput.trim() !== "" &&
    Number(agreedPriceInput) !== (targetRoom?.monthlyPrice ?? 0)
  const discount =
    targetRoom && agreedPriceInput.trim() !== ""
      ? Number(agreedPriceInput) - targetRoom.monthlyPrice
      : 0

  if (!room || !hostel) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg" />
      </Sheet>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 sm:max-w-lg"
      >
        <SheetHeader className="border-b border-[var(--border)] pb-4">
          <SheetTitle>Assign Nomad</SheetTitle>
          <SheetDescription>
            Assign a student to a bed in Room {room.number} ({hostel.name}).
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-1 py-5">
          {/* Student search */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Nomad</Label>
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
                hostels={hostels}
                rooms={rooms}
              />
            ) : (
              <>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <Input
                    placeholder="Search nomads..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 pl-8"
                    aria-label="Search nomads to assign"
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
                              {s.hostelId ? (
                                <>
                                  <p>
                                    {hostels.find((h) => h.id === s.hostelId)?.name}
                                  </p>
                                  <p>
                                    Room {rooms.find((r) => r.id === s.roomId)?.number}
                                  </p>
                                </>
                              ) : (
                                <Badge variant="muted">Unassigned</Badge>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </section>

          {/* Bed selector (target) */}
          <section className="space-y-3">
            <Label>Bed</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-normal text-[var(--muted-foreground)]">
                  Hostel
                </Label>
                <Select
                  value={targetHostelId}
                  onValueChange={setTargetHostelId}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select hostel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hostels.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-normal text-[var(--muted-foreground)]">
                  Room
                </Label>
                <Select
                  value={targetRoomId}
                  onValueChange={setTargetRoomId}
                  disabled={!targetHostelId}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue
                      placeholder={
                        targetHostelId ? "Select room" : "Select hostel first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {hostelRooms.map((r) => {
                      const taken = students.filter(
                        (s) => s.roomId === r.id && s.status === "Active",
                      ).length
                      const isFull = taken >= r.capacity
                      return (
                        <SelectItem
                          key={r.id}
                          value={r.id}
                          disabled={isFull}
                        >
                          Room {r.number} ({taken}/{r.capacity})
                          {isFull ? " — Full" : ""}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {targetRoom && (
              <div className="space-y-1.5">
                <Label className="text-xs font-normal text-[var(--muted-foreground)]">
                  Bed
                </Label>
                {vacantBeds.length === 0 ? (
                  <p className="rounded-md bg-[var(--destructive-soft)] px-3 py-2 text-xs font-medium text-[var(--destructive-soft-foreground)]">
                    No vacant beds in this room.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {vacantBeds.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setTargetBed(b)}
                        className={cn(
                          "flex h-9 min-w-[3rem] items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors",
                          targetBed === b
                            ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                            : "border-[var(--border)] bg-transparent hover:bg-[var(--accent)]",
                        )}
                      >
                        Bed {b}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {targetRoom && (
              <div className="mt-3 space-y-3 rounded-md border border-[var(--border)] bg-[var(--muted)]/30 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Room default monthly price
                  </p>
                  <p className="text-sm font-medium tabular-nums">
                    {new Intl.NumberFormat("en-PK", {
                      style: "currency",
                      currency: "PKR",
                      maximumFractionDigits: 0,
                    }).format(targetRoom.monthlyPrice)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-normal text-[var(--muted-foreground)]">
                    Agreed Monthly Price{" "}
                    <span className="text-[10px]">(edit if negotiated differently)</span>
                  </Label>
                  <div className="relative mt-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted-foreground)]">
                      Rs
                    </span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={agreedPriceInput}
                      onChange={(e) => setAgreedPriceInput(e.target.value)}
                      className="pl-9 tabular-nums"
                    />
                  </div>
                  {isNegotiated && targetRoom && (
                    <p
                      className={`mt-1.5 text-[11px] tabular-nums ${
                        discount < 0
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {discount < 0
                        ? `Discount: ${new Intl.NumberFormat("en-PK", {
                            style: "currency",
                            currency: "PKR",
                            maximumFractionDigits: 0,
                          }).format(Math.abs(discount))} below room default`
                        : `Premium: ${new Intl.NumberFormat("en-PK", {
                            style: "currency",
                            currency: "PKR",
                            maximumFractionDigits: 0,
                          }).format(discount)} above room default`}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                    Pre-filled with the room's default. Edit if a different price
                    was negotiated. The agreed price becomes this assignment's
                    accommodation fee (Finance billing only — the room default
                    stays unchanged).
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        <SheetFooter className="border-t border-[var(--border)] px-1 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm} isSubmitting={isSubmitting}>
            <UserPlus className="h-3.5 w-3.5" />
            {isSubmitting ? "Assigning…" : "Assign Nomad"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function SelectedStudentCard({
  student,
  hostels,
  rooms,
}: {
  student: Student
  hostels: Hostel[]
  rooms: Room[]
}) {
  const hostelName = hostels.find((h) => h.id === student.hostelId)?.name
  const roomNumber = rooms.find((r) => r.id === student.roomId)?.number

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{student.name}</p>
          <p className="truncate text-xs text-[var(--muted-foreground)]">
            {student.studentCode} · {student.bio}
          </p>
        </div>
        <Badge variant="success-soft">{student.status}</Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-3 text-xs">
        <div>
          <p className="text-[var(--muted-foreground)]">Phone</p>
          <p className="font-medium">{student.phone}</p>
        </div>
        <div>
          <p className="text-[var(--muted-foreground)]">Current</p>
          <p className="font-medium">
            {student.hostelId ? (
              <>
                {hostelName} / Room {roomNumber} / Bed {student.bedLabel}
              </>
            ) : (
              <span className="text-[var(--muted-foreground)]">Unassigned</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
