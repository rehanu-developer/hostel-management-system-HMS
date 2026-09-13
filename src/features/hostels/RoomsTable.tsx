import { MoreHorizontal, Pencil, Trash2, UserPlus, DoorOpen } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { roomStatusVariant, type RoomStatus } from "./hostelStatus"
import type { Room, Student } from "@/types"

export interface RoomRowData {
  room: Room
  students: Student[]
  occupied: number
  vacant: number
  vacantBeds: string[]
  status: RoomStatus
  occupancyPercent: number
}

interface RoomsTableProps {
  rooms: RoomRowData[]
  isLoading: boolean
  onViewRoom: (data: RoomRowData) => void
  onEditRoom: (room: Room) => void
  onAssignStudent: (data: RoomRowData) => void
  onDeleteRoom: (room: Room) => void
}

export function RoomsTable({
  rooms,
  isLoading,
  onViewRoom,
  onEditRoom,
  onAssignStudent,
  onDeleteRoom,
}: RoomsTableProps) {
  if (isLoading) {
    return <RoomsTableSkeleton />
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <Table className="table-fixed">
        <colgroup>
          <col className="w-[110px]" />
          <col className="w-[110px]" />
          <col className="w-[100px]" />
          <col className="w-[100px]" />
          <col className="w-[180px]" />
          <col />
          <col className="w-[180px]" />
          <col className="w-[72px] pr-6 text-right" />
        </colgroup>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-6">Room</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Occupied</TableHead>
            <TableHead>Vacant</TableHead>
            <TableHead className="hidden lg:table-cell">Occupancy</TableHead>
            <TableHead>Nomads</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-6 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rooms.length === 0 ? (
            <EmptyRoomsRow />
          ) : (
            rooms.map((r) => (
              <TableRow
                key={r.room.id}
                className="group cursor-pointer"
                onClick={() => onViewRoom(r)}
              >
                <TableCell className="pl-6">
                  <span className="font-medium text-[14px]">
                    Room {r.room.number}
                  </span>
                </TableCell>
                <TableCell className="text-[14px] tabular-nums text-[var(--muted-foreground)]">
                  {r.room.capacity} beds
                </TableCell>
                <TableCell className="text-[14px] tabular-nums">
                  {r.occupied}
                </TableCell>
                <TableCell className="text-[14px] tabular-nums">
                  {r.vacant}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center gap-2">
                    <Progress
                      value={r.occupancyPercent}
                      className="h-1.5 w-20"
                    />
                    <span className="text-xs tabular-nums text-[var(--muted-foreground)]">
                      {r.occupancyPercent}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {r.students.length === 0 ? (
                    <span className="text-[14px] text-[var(--muted-foreground)]">
                      —
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {r.students.slice(0, 3).map((s) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center rounded-md bg-[var(--muted)] px-1.5 py-0.5 text-xs font-medium text-[var(--muted-foreground)]"
                        >
                          {s.name}
                        </span>
                      ))}
                      {r.students.length > 3 && (
                        <span className="inline-flex items-center rounded-md bg-[var(--muted)] px-1.5 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
                          +{r.students.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={roomStatusVariant[r.status]}>
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell
                  className="pr-6 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        aria-label={`Actions for Room ${r.room.number}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wider">
                        Actions
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => onViewRoom(r)}
                        className="gap-2"
                      >
                        <DoorOpen className="text-[var(--muted-foreground)]" />
                        View Room
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => onEditRoom(r.room)}
                        className="gap-2"
                      >
                        <Pencil className="text-[var(--muted-foreground)]" />
                        Edit Room
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => onAssignStudent(r)}
                        disabled={r.vacant === 0}
                        className="gap-2"
                      >
                        <UserPlus className="text-[var(--muted-foreground)]" />
                        Assign Student
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => onDeleteRoom(r.room)}
                        disabled={r.occupied > 0}
                        className="gap-2 text-[var(--destructive-soft-foreground)] focus:bg-[var(--destructive-soft)] focus:text-[var(--destructive-soft-foreground)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      >
                        <Trash2 />
                        Delete Room
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function EmptyRoomsRow() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={8} className="py-16 text-center">
        <div className="flex flex-col items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <DoorOpen className="h-5 w-5" />
          <p className="font-medium text-[var(--foreground)]">No rooms yet</p>
          <p>Add a room to begin managing beds and nomad assignments.</p>
        </div>
      </TableCell>
    </TableRow>
  )
}

function RoomsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Room</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Occupied</TableHead>
            <TableHead>Vacant</TableHead>
            <TableHead className="hidden lg:table-cell">Occupancy</TableHead>
            <TableHead>Nomads</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-6 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i} className="hover:bg-transparent">
              <TableCell className="pl-6">
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-8" />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <Skeleton className="h-1.5 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20 rounded-full" />
              </TableCell>
              <TableCell className="pr-6 text-right">
                <Skeleton className="ml-auto h-8 w-8 rounded-full" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
