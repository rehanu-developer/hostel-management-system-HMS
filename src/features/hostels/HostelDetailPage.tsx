import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  useDataStore,
  getHostelStats,
  getRoomStats,
} from "@/stores/dataStore"
import { hostelStatusVariant } from "./hostelStatus"
import { RoomsToolbar, EMPTY_ROOMS_FILTERS, type RoomsFilters } from "./RoomsToolbar"
import { RoomsTable, type RoomRowData } from "./RoomsTable"
import { HostelSheet } from "./HostelSheet"
import { RoomSheet } from "./RoomSheet"
import { RoomDetailSheet } from "./RoomDetailSheet"
import { AssignStudentSheet } from "./AssignStudentSheet"
import { ChangeRoomSheet } from "./ChangeRoomSheet"
import { DeleteRoomDialog } from "./DeleteRoomDialog"
import type { HostelFormValues } from "@/lib/schemas"
import type { Hostel, Room, Student } from "@/types"

export function HostelDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const hostels = useDataStore((s) => s.hostels)
  const rooms = useDataStore((s) => s.rooms)
  const students = useDataStore((s) => s.students)
  const updateHostel = useDataStore((s) => s.updateHostel)
  const addRoom = useDataStore((s) => s.addRoom)
  const updateRoom = useDataStore((s) => s.updateRoom)
  const deleteRoom = useDataStore((s) => s.deleteRoom)
  const assignStudent = useDataStore((s) => s.assignStudent)
  const changeStudentRoom = useDataStore((s) => s.changeStudentRoom)

  const hostel = hostels.find((h) => h.id === id)

  const [filters, setFilters] = useState<RoomsFilters>(EMPTY_ROOMS_FILTERS)
  const [isLoading, setIsLoading] = useState(false)

  const [editHostelOpen, setEditHostelOpen] = useState(false)
  const [addRoomOpen, setAddRoomOpen] = useState(false)
  const [editRoom, setEditRoom] = useState<Room | null>(null)

  const [roomDetail, setRoomDetail] = useState<RoomRowData | null>(null)
  const [assignFor, setAssignFor] = useState<Room | null>(null)
  const [changeFor, setChangeFor] = useState<Student | null>(null)
  const [deleteRoomTarget, setDeleteRoomTarget] = useState<Room | null>(null)

  useEffect(() => {
    setIsLoading(true)
    const t = setTimeout(() => setIsLoading(false), 200)
    return () => clearTimeout(t)
  }, [filters, id])

  const hostelRooms = useMemo(
    () => (hostel ? rooms.filter((r) => r.hostelId === hostel.id) : []),
    [rooms, hostel],
  )

  const stats = useMemo(
    () => (hostel ? getHostelStats(hostel, rooms, students) : null),
    [hostel, rooms, students],
  )

  const rows: RoomRowData[] = useMemo(
    () =>
      hostelRooms.map((r) => getRoomStats(r, students)),
    [hostelRooms, students],
  )

  const filteredRows = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return rows.filter((r) => {
      if (search && !`room ${r.room.number}`.toLowerCase().includes(search)) {
        return false
      }
      if (filters.status !== "all" && r.status !== filters.status) return false
      if (filters.capacity !== "all" && String(r.room.capacity) !== filters.capacity)
        return false
      return true
    })
  }, [rows, filters])

  if (!hostel || !stats) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <p className="text-sm text-[var(--muted-foreground)]">
          Hostel not found.
        </p>
        <Button variant="outline" onClick={() => navigate("/hostels")}>
          Back to hostels
        </Button>
      </div>
    )
  }

  const handleEditHostel = (values: HostelFormValues) => {
    updateHostel(hostel.id, values)
    toast.success(`${values.name} updated`)
    setEditHostelOpen(false)
  }

  const handleAddRoom = (values: {
    hostelId: string
    number: string
    capacity: number
    monthlyPrice: number
  }) => {
    const id = addRoom({
      hostelId: values.hostelId,
      number: values.number,
      capacity: values.capacity,
      monthlyPrice: values.monthlyPrice,
    })
    toast.success(`Room ${values.number} added`)
    setAddRoomOpen(false)
    void id
  }

  const handleEditRoomSubmit = (values: {
    hostelId: string
    number: string
    capacity: number
    monthlyPrice: number
  }) => {
    if (editRoom) {
      updateRoom(editRoom.id, values)
      toast.success(`Room ${values.number} updated`)
      setEditRoom(null)
    }
  }

  const handleAssignConfirm = (
    studentId: string,
    hostelId: string,
    roomId: string,
    bedLabel: string,
  ) => {
    assignStudent(studentId, hostelId, roomId, bedLabel)
    const stu = students.find((s) => s.id === studentId)
    toast.success(`${stu?.name ?? "Student"} assigned`)
    setAssignFor(null)
  }

  const handleChangeConfirm = (
    studentId: string,
    hostelId: string,
    roomId: string,
    bedLabel: string,
  ) => {
    changeStudentRoom(studentId, hostelId, roomId, bedLabel)
    const stu = students.find((s) => s.id === studentId)
    toast.success(`${stu?.name ?? "Student"} moved to new room`)
    setChangeFor(null)
  }

  const handleDeleteRoomConfirm = (room: Room) => {
    deleteRoom(room.id)
    toast.success(`Room ${room.number} deleted`)
    setDeleteRoomTarget(null)
  }

  const deleteTargetStats = deleteRoomTarget
    ? getRoomStats(deleteRoomTarget, students)
    : null

  return (
    <>
      {/* Sub-header */}
      <div className="flex flex-col gap-3 border-b border-[var(--border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/hostels")}
            className="-ml-2 gap-1.5 text-[var(--muted-foreground)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Hostels
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-semibold tracking-tight">
                {hostel.name}
              </h1>
              <Badge variant={hostelStatusVariant[hostel.status]}>
                {hostel.status}
              </Badge>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              {hostel.location}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setEditHostelOpen(true)}
          variant="outline"
          size="sm"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Hostel
        </Button>
      </div>

      <div className="space-y-6 p-4 lg:p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Rooms" value={stats.totalRooms} sub="rooms" />
          <StatCard
            label="Total Beds"
            value={stats.totalBeds}
            sub="beds"
            hint={`${stats.occupiedBeds} occupied`}
          />
          <StatCard
            label="Occupancy"
            value={`${stats.occupancyPercent}%`}
            sub="of beds"
            accent="primary"
          />
          <StatCard
            label="Vacant"
            value={stats.vacantBeds}
            sub="beds"
            hint={`${stats.vacantRooms} vacant rooms`}
            accent="success"
          />
        </div>

        {/* Rooms header + toolbar */}
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-base font-semibold">Rooms</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Manage rooms, beds and student assignments for this hostel.
              </p>
            </div>
            <Button onClick={() => setAddRoomOpen(true)} size="sm">
              <Plus className="h-3.5 w-3.5" />
              Add Room
            </Button>
          </div>

          <RoomsToolbar
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters(EMPTY_ROOMS_FILTERS)}
          />

          <RoomsTable
            rooms={filteredRows}
            isLoading={isLoading}
            onViewRoom={(d) => setRoomDetail(d)}
            onEditRoom={(r) => setEditRoom(r)}
            onAssignStudent={(d) => setAssignFor(d.room)}
            onDeleteRoom={(r) => setDeleteRoomTarget(r)}
          />
        </div>
      </div>

      {/* Edit hostel sheet */}
      <HostelSheet
        mode="edit"
        open={editHostelOpen}
        onOpenChange={setEditHostelOpen}
        hostel={hostel}
        onSubmit={handleEditHostel}
      />

      {/* Add room sheet (locked to current hostel) */}
      <RoomSheet
        mode="add"
        open={addRoomOpen}
        onOpenChange={setAddRoomOpen}
        hostels={hostels}
        lockedHostelId={hostel.id}
        onSubmit={handleAddRoom}
      />

      {/* Edit room sheet */}
      <RoomSheet
        mode="edit"
        open={!!editRoom}
        onOpenChange={(open) => !open && setEditRoom(null)}
        room={editRoom}
        hostels={hostels}
        onSubmit={handleEditRoomSubmit}
      />

      {/* Room detail sheet */}
      <RoomDetailSheet
        open={!!roomDetail}
        onOpenChange={(open) => !open && setRoomDetail(null)}
        data={roomDetail}
        hostelName={hostel.name}
        onAssign={(r) => setAssignFor(r)}
        onChangeAssignment={(s) => setChangeFor(s)}
        onEditRoom={(r) => setEditRoom(r)}
        onDeleteRoom={(r) => setDeleteRoomTarget(r)}
      />

      {/* Assign student sheet */}
      <AssignStudentSheet
        open={!!assignFor}
        onOpenChange={(open) => !open && setAssignFor(null)}
        room={assignFor}
        hostel={hostel}
        students={students}
        hostels={hostels}
        rooms={rooms}
        onConfirm={handleAssignConfirm}
      />

      {/* Change room sheet */}
      <ChangeRoomSheet
        open={!!changeFor}
        onOpenChange={(open) => !open && setChangeFor(null)}
        student={changeFor}
        hostels={hostels}
        rooms={rooms}
        students={students}
        onConfirm={handleChangeConfirm}
      />

      {/* Delete room dialog */}
      <DeleteRoomDialog
        room={deleteRoomTarget}
        hostelName={hostel.name}
        occupiedCount={deleteTargetStats?.occupied ?? 0}
        open={!!deleteRoomTarget}
        onOpenChange={(open) => !open && setDeleteRoomTarget(null)}
        onConfirm={handleDeleteRoomConfirm}
      />
    </>
  )
}

function StatCard({
  label,
  value,
  sub,
  hint,
  accent,
}: {
  label: string
  value: string | number
  sub: string
  hint?: string
  accent?: "primary" | "success"
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
          {label}
        </p>
        <p
          className={
            "mt-1 font-display text-2xl font-semibold tabular-nums " +
            (accent === "success" ? "text-[var(--success-soft-foreground)]" : "")
          }
        >
          {value}{" "}
          <span className="text-xs font-normal text-[var(--muted-foreground)]">
            {sub}
          </span>
        </p>
        {hint && (
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">{hint}</p>
        )}
      </CardContent>
    </Card>
  )
}
