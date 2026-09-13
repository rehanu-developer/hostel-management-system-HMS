import { useEffect, useMemo, useState } from "react"
import { ArrowRightLeft } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { Student, Hostel, Room } from "@/types"

interface ChangeRoomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
  hostels: Hostel[]
  rooms: Room[]
  students: Student[]
  onConfirm: (
    studentId: string,
    hostelId: string,
    roomId: string,
    bedLabel: string,
  ) => void
}

export function ChangeRoomSheet({
  open,
  onOpenChange,
  student,
  hostels,
  rooms,
  students,
  onConfirm,
}: ChangeRoomSheetProps) {
  const [targetHostelId, setTargetHostelId] = useState("")
  const [targetRoomId, setTargetRoomId] = useState("")
  const [targetBed, setTargetBed] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open && student) {
      setTargetHostelId(student.hostelId)
      setTargetRoomId(student.roomId)
      setTargetBed("")
    }
  }, [open, student])

  const currentHostel = hostels.find((h) => h.id === student?.hostelId)
  const currentRoom = rooms.find((r) => r.id === student?.roomId)

  const hostelRooms = useMemo(
    () => rooms.filter((r) => r.hostelId === targetHostelId),
    [rooms, targetHostelId],
  )

  const targetRoom = rooms.find((r) => r.id === targetRoomId)

  const vacantBeds = useMemo(() => {
    if (!targetRoom) return []
    const taken = new Set(
      students
        .filter(
          (s) =>
            s.roomId === targetRoom.id &&
            s.status === "Active" &&
            s.id !== student?.id,
        )
        .map((s) => s.bedLabel),
    )
    const result: string[] = []
    for (let i = 0; i < targetRoom.capacity; i++) {
      const label = String.fromCharCode(65 + i)
      // Allow the student's own current bed as a valid target
      if (!taken.has(label) || label === student?.bedLabel) result.push(label)
    }
    return result
  }, [targetRoom, students, student?.id, student?.bedLabel])

  useEffect(() => {
    if (vacantBeds.length > 0 && !vacantBeds.includes(targetBed)) {
      setTargetBed(vacantBeds[0])
    } else if (vacantBeds.length === 0) {
      setTargetBed("")
    }
  }, [targetRoomId, vacantBeds, targetBed])

  const canConfirm =
    !!student &&
    targetHostelId !== "" &&
    targetRoomId !== "" &&
    targetBed !== "" &&
    (targetHostelId !== student.hostelId ||
      targetRoomId !== student.roomId ||
      targetBed !== student.bedLabel)

  const handleConfirm = async () => {
    if (!canConfirm || !student) return
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 350))
    onConfirm(student.id, targetHostelId, targetRoomId, targetBed)
    setIsSubmitting(false)
    onOpenChange(false)
  }

  if (!student) {
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
          <SheetTitle>Change Room</SheetTitle>
          <SheetDescription>
            Move {student.name} to a different bed. Previous assignment will be
            saved to history.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-1 py-5">
          {/* Current assignment */}
          <section className="space-y-3">
            <h3 className="font-display text-sm font-semibold">
              Current assignment
            </h3>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{student.name}</p>
                <Badge variant="success-soft">{student.status}</Badge>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-[var(--muted-foreground)]">Hostel</p>
                  <p className="font-medium">
                    {currentHostel?.name ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--muted-foreground)]">Room</p>
                  <p className="font-medium">
                    {currentRoom ? `Room ${currentRoom.number}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--muted-foreground)]">Bed</p>
                  <p className="font-medium">
                    {student.bedLabel ? `Bed ${student.bedLabel}` : "—"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* New assignment */}
          <section className="space-y-3">
            <h3 className="font-display text-sm font-semibold">Change to</h3>
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
                        (s) =>
                          s.roomId === r.id &&
                          s.status === "Active" &&
                          s.id !== student.id,
                      ).length
                      const isFull = taken >= r.capacity
                      const isCurrent = r.id === student.roomId
                      return (
                        <SelectItem
                          key={r.id}
                          value={r.id}
                          disabled={isFull}
                        >
                          Room {r.number} ({taken}/{r.capacity})
                          {isFull ? " — Full" : ""}
                          {isCurrent ? " (current)" : ""}
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
                        {b === student.bedLabel &&
                          targetRoomId === student.roomId && (
                            <span className="ml-1 text-[10px] font-normal opacity-70">
                              (current)
                            </span>
                          )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <SheetFooter className="border-t border-[var(--border)] px-1 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm} isSubmitting={isSubmitting}>
            <ArrowRightLeft className="h-3.5 w-3.5" />
            {isSubmitting ? "Moving…" : "Confirm Change"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
