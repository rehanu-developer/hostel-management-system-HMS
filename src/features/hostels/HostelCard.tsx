import { useNavigate } from "react-router-dom"
import { ChevronRight, MapPin, MoreHorizontal } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { hostelStatusVariant } from "./hostelStatus"
import type { Hostel } from "@/types"

export interface HostelCardData {
  hostel: Hostel
  totalRooms: number
  occupiedRooms: number
  vacantRooms: number
  totalBeds: number
  occupiedBeds: number
  vacantBeds: number
  occupancyPercent: number
}

interface HostelCardProps {
  data: HostelCardData
  onEdit: (hostel: Hostel) => void
  onManageRooms: (hostel: Hostel) => void
  onDeactivate: (hostel: Hostel) => void
}

export function HostelCard({
  data,
  onEdit,
  onManageRooms,
  onDeactivate,
}: HostelCardProps) {
  const navigate = useNavigate()
  const { hostel } = data

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 border-b border-[var(--border)] pb-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-semibold tracking-tight">
              {hostel.name}
            </h3>
            <Badge variant={hostelStatusVariant[hostel.status]}>
              {hostel.status}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{hostel.location}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              aria-label={`Actions for ${hostel.name}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wider">
              Actions
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate(`/hostels/${hostel.id}`)}>
              View Hostel
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onManageRooms(hostel)}>
              Manage Rooms
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onEdit(hostel)}>
              Edit Hostel
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onDeactivate(hostel)}>
              {hostel.status === "Active" ? "Deactivate Hostel" : "Activate Hostel"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-4 p-5">
        <MetricRow
          label="Rooms"
          total={data.totalRooms}
          occupied={data.occupiedRooms}
          vacant={data.vacantRooms}
          unit="rooms"
        />
        <MetricRow
          label="Beds"
          total={data.totalBeds}
          occupied={data.occupiedBeds}
          vacant={data.vacantBeds}
          unit="beds"
        />

        <div className="space-y-2 border-t border-[var(--border)] pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              Occupancy
            </span>
            <span className="text-xs font-medium tabular-nums text-[var(--foreground)]">
              {data.occupancyPercent}%
            </span>
          </div>
          <Progress value={data.occupancyPercent} className="h-1.5" />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between"
          onClick={() => navigate(`/hostels/${hostel.id}`)}
        >
          <span>View Hostel</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  )
}

function MetricRow({
  label,
  total,
  occupied,
  vacant,
  unit,
}: {
  label: string
  total: number
  occupied: number
  vacant: number
  unit: string
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-[var(--muted-foreground)]">{label}</p>
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Total" value={total} unit={unit} />
        <Metric label="Occupied" value={occupied} unit={unit} />
        <Metric label="Vacant" value={vacant} unit={unit} muted />
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  unit,
  muted,
}: {
  label: string
  value: number
  unit: string
  muted?: boolean
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
        {label}
      </p>
      <p
        className={
          muted
            ? "font-display text-base font-semibold tabular-nums text-[var(--muted-foreground)]"
            : "font-display text-base font-semibold tabular-nums"
        }
      >
        {value}{" "}
        <span className="text-xs font-normal text-[var(--muted-foreground)]">
          {unit}
        </span>
      </p>
    </div>
  )
}
