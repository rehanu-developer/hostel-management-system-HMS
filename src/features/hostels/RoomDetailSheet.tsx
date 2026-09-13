import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { UserPlus, ArrowRightLeft, Pencil, Trash2, ExternalLink } from "lucide-react"
import { roomStatusVariant, type RoomStatus } from "./hostelStatus"
import type { Room, Student } from "@/types"

interface RoomDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: {
    room: Room
    students: Student[]
    occupied: number
    vacant: number
    vacantBeds: string[]
    status: RoomStatus
    occupancyPercent: number
  } | null
  hostelName?: string
  onAssign: (room: Room) => void
  onChangeAssignment: (student: Student) => void
  onEditRoom: (room: Room) => void
  onDeleteRoom: (room: Room) => void
}

export function RoomDetailSheet({
  open,
  onOpenChange,
  data,
  hostelName,
  onAssign,
  onChangeAssignment,
  onEditRoom,
  onDeleteRoom,
}: RoomDetailSheetProps) {
  const navigate = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!data) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg" />
      </Sheet>
    )
  }

  const { room, students, occupied, vacant, vacantBeds, status } = data

  // Build bed list
  const beds: { label: string; student?: Student }[] = []
  for (let i = 0; i < room.capacity; i++) {
    const label = String.fromCharCode(65 + i)
    const student = students.find((s) => s.bedLabel === label)
    beds.push({ label, student })
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
              <SheetTitle>Room {room.number}</SheetTitle>
              <SheetDescription>
                {hostelName ? `${hostelName} · ` : ""}
                Capacity {room.capacity} · {occupied} occupied · {vacant} vacant
              </SheetDescription>
            </div>
            <Badge variant={roomStatusVariant[status]}>{status}</Badge>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-1 py-5">
          {/* Top stats */}
          <div className="grid grid-cols-3 gap-2">
            <StatBlock
              label="Capacity"
              value={`${room.capacity}`}
              sub="beds"
            />
            <StatBlock
              label="Occupied"
              value={`${occupied}`}
              sub={`of ${room.capacity}`}
            />
            <StatBlock
              label="Monthly Price"
              value={new Intl.NumberFormat("en-PK", {
                style: "currency",
                currency: "PKR",
                maximumFractionDigits: 0,
              }).format(room.monthlyPrice)}
              sub="per bed / month"
            />
          </div>

          {/* Occupancy progress */}
          <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">
                Occupancy
              </span>
              <span className="text-xs font-medium tabular-nums">
                {data.occupancyPercent}%
              </span>
            </div>
            <Progress value={data.occupancyPercent} className="h-1.5" />
            <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
              <span>{occupied} occupied</span>
              <span>{vacant} vacant</span>
            </div>
          </div>

          {/* Beds list */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold">Beds</h3>
              {vacant > 0 && (
                <Button size="sm" onClick={() => onAssign(room)}>
                  <UserPlus className="h-3.5 w-3.5" />
                  Assign Student
                </Button>
              )}
            </div>

            {vacant === 0 && (
              <p className="rounded-md bg-[var(--destructive-soft)] px-3 py-2 text-xs font-medium text-[var(--destructive-soft-foreground)]">
                This room is full and cannot accept more students.
              </p>
            )}

            <ul className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] bg-[var(--card)]">
              {beds.map((bed) => (
                <li
                  key={bed.label}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--muted)] font-display text-xs font-semibold">
                      {bed.label}
                    </span>
                    <div className="min-w-0">
                      {bed.student ? (
                        <>
                          <p className="truncate text-sm font-medium">
                            {bed.student.name}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {bed.student.studentCode}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-[var(--muted-foreground)]">
                          Available
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {bed.student ? (
                      <>
                        <Badge
                          variant={
                            bed.student.status === "Active"
                              ? "success-soft"
                              : bed.student.status === "Suspended"
                                ? "destructive-soft"
                                : "neutral-soft"
                          }
                        >
                          {bed.student.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => navigate(`/students/${bed.student!.id}`)}
                          aria-label="Open student profile"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onChangeAssignment(bed.student!)}
                          aria-label="Change room assignment"
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <Badge variant="neutral-soft">Vacant</Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <Separator />

          {/* Room-level actions */}
          <section className="space-y-2">
            <h3 className="font-display text-sm font-semibold">Room Actions</h3>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => onEditRoom(room)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit Room
              </Button>
              {occupied === 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start text-[var(--destructive-soft-foreground)] hover:bg-[var(--destructive-soft)]"
                  onClick={() => onDeleteRoom(room)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Room
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Room
                </Button>
              )}
              {confirmDelete && occupied > 0 && (
                <p className="rounded-md bg-[var(--warning-soft)] px-3 py-2 text-xs font-medium text-[var(--warning-soft-foreground)]">
                  Cannot delete: {occupied} student
                  {occupied === 1 ? "" : "s"} still assigned. Move them first.
                </p>
              )}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function StatBlock({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--card)] p-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-1 font-display text-base font-semibold tabular-nums">
        {value}
      </p>
      <p className="text-[11px] text-[var(--muted-foreground)]">{sub}</p>
    </div>
  )
}
