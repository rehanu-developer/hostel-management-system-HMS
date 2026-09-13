import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Building2,
  BedDouble,
  DoorOpen,
  CheckCircle2,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ReportFiltersBar } from "./ReportFiltersBar"
import { ReportTableSkeleton, ReportEmptyState } from "./ReportTable"
import { KpiTile } from "./KpiTile"
import {
  useDataStore,
  getHostelStats,
  getRoomStats,
} from "@/stores/dataStore"
import type { ExportColumn } from "./export"

type RoomFilter = "all" | "vacant" | "available" | "full"

interface OccupancyReportProps {
  onExportReady?: (payload: {
    rows: Array<{
      hostelId: string
      hostelName: string
      location: string
      totalRooms: number
      occupiedRooms: number
      vacantRooms: number
      totalBeds: number
      occupiedBeds: number
      occupancyPercent: number
    }>
    columns: ExportColumn<{
      hostelId: string
      hostelName: string
      location: string
      totalRooms: number
      occupiedRooms: number
      vacantRooms: number
      totalBeds: number
      occupiedBeds: number
      occupancyPercent: number
    }>[]
    sheetTitle: string
  }) => void
}

export function OccupancyReport({ onExportReady }: OccupancyReportProps = {}) {
  const hostels = useDataStore((s) => s.hostels)
  const rooms = useDataStore((s) => s.rooms)
  const students = useDataStore((s) => s.students)
  const navigate = useNavigate()

  const [hostelFilter, setHostelFilter] = useState("all")
  const [roomFilter, setRoomFilter] = useState<RoomFilter>("all")
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    const t = setTimeout(() => setIsLoading(false), 200)
    return () => clearTimeout(t)
  }, [hostelFilter, roomFilter, search])

  const hostelSummary = useMemo(
    () =>
      hostels
        .filter((h) =>
          hostelFilter === "all"
            ? true
            : hostels.find((x) => x.id === hostelFilter) === h ||
              h.id === hostelFilter,
        )
        .map((h) => getHostelStats(h, rooms, students)),
    [hostels, rooms, students, hostelFilter],
  )

  const roomRows = useMemo(() => {
    const filteredHostels = hostelSummary
      .filter((h) => hostelFilter === "all" || h.hostel.id === hostelFilter)
      .map((h) => h.hostel)

    const allRooms = rooms.filter((r) =>
      filteredHostels.some((h) => h.id === r.hostelId),
    )

    return allRooms
      .map((r) => {
        const stats = getRoomStats(r, students)
        const hostel = hostels.find((h) => h.id === r.hostelId)
        return { ...stats, hostelName: hostel?.name ?? "" }
      })
      .filter((r) => {
        if (search) {
          const q = search.toLowerCase()
          if (
            !`room ${r.room.number}`.toLowerCase().includes(q) &&
            !r.hostelName.toLowerCase().includes(q)
          )
            return false
        }
        if (roomFilter === "vacant" && r.occupied > 0) return false
        if (roomFilter === "available" && r.status !== "Available") return false
        if (roomFilter === "full" && r.status !== "Full") return false
        return true
      })
  }, [rooms, hostels, students, hostelFilter, roomFilter, search])

  const hasFilters =
    hostelFilter !== "all" || roomFilter !== "all" || search !== ""

  const overallStats = useMemo(() => {
    const totalBeds = hostelSummary.reduce((sum, h) => sum + h.totalBeds, 0)
    const occupiedBeds = hostelSummary.reduce(
      (sum, h) => sum + h.occupiedBeds,
      0,
    )
    return {
      totalRooms: hostelSummary.reduce((sum, h) => sum + h.totalRooms, 0),
      occupiedRooms: hostelSummary.reduce((sum, h) => sum + h.occupiedRooms, 0),
      totalBeds,
      occupiedBeds,
      vacantBeds: totalBeds - occupiedBeds,
      occupancyPercent:
        totalBeds === 0 ? 0 : Math.round((occupiedBeds / totalBeds) * 100),
    }
  }, [hostelSummary])

  // Notify parent of export-ready data
  useEffect(() => {
    if (!onExportReady) return
    onExportReady({
      rows: hostelSummary.map((h) => ({
        hostelId: h.hostel.id,
        hostelName: h.hostel.name,
        location: h.hostel.location,
        totalRooms: h.totalRooms,
        occupiedRooms: h.occupiedRooms,
        vacantRooms: h.vacantRooms,
        totalBeds: h.totalBeds,
        occupiedBeds: h.occupiedBeds,
        occupancyPercent: h.occupancyPercent,
      })),
      columns: [
        { header: "Hostel", accessor: (r) => r.hostelName },
        { header: "Location", accessor: (r) => r.location },
        { header: "Total Rooms", accessor: (r) => r.totalRooms, align: "right" },
        { header: "Occupied Rooms", accessor: (r) => r.occupiedRooms, align: "right" },
        { header: "Vacant Rooms", accessor: (r) => r.vacantRooms, align: "right" },
        { header: "Total Beds", accessor: (r) => r.totalBeds, align: "right" },
        { header: "Occupied Beds", accessor: (r) => r.occupiedBeds, align: "right" },
        { header: "Occupancy %", accessor: (r) => `${r.occupancyPercent}%`, align: "right" },
      ],
      sheetTitle: "Occupancy Report",
    })
  }, [hostelSummary, onExportReady])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <ReportTableSkeleton rows={4} cols={6} />
        <ReportTableSkeleton rows={6} cols={6} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile
          icon={DoorOpen}
          label="Total Rooms"
          value={`${overallStats.occupiedRooms}/${overallStats.totalRooms}`}
          sub="occupied"
        />
        <KpiTile
          icon={BedDouble}
          label="Total Beds"
          value={`${overallStats.occupiedBeds}/${overallStats.totalBeds}`}
          sub="occupied"
        />
        <KpiTile
          icon={CheckCircle2}
          label="Vacant Beds"
          value={overallStats.vacantBeds}
          sub="available"
          accent="success"
        />
        <KpiTile
          icon={Building2}
          label="Occupancy"
          value={`${overallStats.occupancyPercent}%`}
          sub="of all beds"
        />
      </div>

      {/* Filters */}
      <ReportFiltersBar
        search={{ value: search, onChange: setSearch, placeholder: "Search rooms or hostels..." }}
        selects={[
          {
            value: hostelFilter,
            onChange: setHostelFilter,
            placeholder: "All hostels",
            options: [
              { value: "all", label: "All hostels" },
              ...hostels.map((h) => ({ value: h.id, label: h.name })),
            ],
            width: "sm:w-[180px]",
          },
        ]}
        custom={
          <Select value={roomFilter} onValueChange={(v) => setRoomFilter(v as RoomFilter)}>
            <SelectTrigger className="h-9 w-full sm:w-[170px]">
              <SelectValue placeholder="All rooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All rooms</SelectItem>
              <SelectItem value="vacant">Rooms with vacant beds</SelectItem>
              <SelectItem value="available">Completely vacant rooms</SelectItem>
              <SelectItem value="full">Full rooms</SelectItem>
            </SelectContent>
          </Select>
        }
        onClear={() => {
          setHostelFilter("all")
          setRoomFilter("all")
          setSearch("")
        }}
        hasActiveFilters={hasFilters}
      />

      {/* Hostel-level table */}
      <Card>
        <CardHeader>
          <CardTitle>Occupancy by Hostel</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <colgroup>
              <col />
              <col className="w-[80px]" />
              <col className="w-[110px]" />
              <col className="w-[100px]" />
              <col className="w-[90px]" />
              <col className="w-[100px]" />
              <col className="w-[180px]" />
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Hostel</TableHead>
                <TableHead className="text-right">Rooms</TableHead>
                <TableHead className="text-right">Occupied</TableHead>
                <TableHead className="text-right">Vacant</TableHead>
                <TableHead className="text-right">Beds</TableHead>
                <TableHead className="text-right">Occupancy</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hostelSummary.map((h) => (
                <TableRow key={h.hostel.id} className="cursor-pointer">
                  <TableCell>
                    <button
                      onClick={() => navigate(`/hostels/${h.hostel.id}`)}
                      className="text-left font-medium text-[var(--foreground)] hover:underline"
                    >
                      {h.hostel.name}
                    </button>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {h.hostel.location}
                    </p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {h.totalRooms}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {h.occupiedRooms}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {h.vacantRooms}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {h.totalBeds}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {h.occupancyPercent}%
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={h.occupancyPercent}
                        className="h-1.5 w-24"
                      />
                      <span className="text-xs tabular-nums text-[var(--muted-foreground)]">
                        {h.occupiedBeds}/{h.totalBeds}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Room availability */}
      <Card>
        <CardHeader>
          <CardTitle>Room Availability</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {roomRows.length === 0 ? (
            <div className="p-6">
              <ReportEmptyState
                onClear={() => {
                  setHostelFilter("all")
                  setRoomFilter("all")
                  setSearch("")
                }}
                hasFilters={hasFilters}
              />
            </div>
          ) : (
            <Table>
              <colgroup>
                <col />
                <col className="w-[120px]" />
                <col className="w-[90px]" />
                <col className="w-[90px]" />
                <col className="w-[90px]" />
                <col className="w-[160px]" />
              </colgroup>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Room</TableHead>
                  <TableHead>Hostel</TableHead>
                  <TableHead className="text-right">Capacity</TableHead>
                  <TableHead className="text-right">Occupied</TableHead>
                  <TableHead className="text-right">Vacant</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roomRows.map((r) => (
                  <TableRow
                    key={r.room.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/hostels/${r.room.hostelId}`)}
                  >
                    <TableCell className="font-medium">Room {r.room.number}</TableCell>
                    <TableCell className="text-[var(--muted-foreground)]">
                      {r.hostelName}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.room.capacity}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.occupied}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.vacant}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === "Available"
                            ? "success-soft"
                            : r.status === "Full"
                              ? "destructive-soft"
                              : "warning-soft"
                        }
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

