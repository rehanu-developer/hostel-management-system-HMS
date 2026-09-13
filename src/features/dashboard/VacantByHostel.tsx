import { BedDouble, DoorOpen, Home } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

interface VacantByHostelProps {
  data: {
    hostelId: string
    hostelName: string
    totalBeds: number
    occupiedBeds: number
    vacantBeds: number
    vacantRooms: number
    totalRooms: number
  }[]
}

export function VacantByHostel({ data }: VacantByHostelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vacant Spaces by Hostel</CardTitle>
        <CardDescription>
          Available beds and rooms grouped by location.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((h) => {
          const pct =
            h.totalBeds === 0
              ? 0
              : Math.round((h.occupiedBeds / h.totalBeds) * 100)
          return (
            <div key={h.hostelId} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Home className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
                  <p className="truncate text-sm font-medium">{h.hostelName}</p>
                </div>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {pct}% occupied
                </span>
              </div>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                <div
                  className="h-full rounded-full bg-[var(--primary)] transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
                <span className="inline-flex items-center gap-1.5">
                  <BedDouble className="h-3.5 w-3.5" />
                  {h.vacantBeds} vacant bed{h.vacantBeds === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <DoorOpen className="h-3.5 w-3.5" />
                  {h.vacantRooms} vacant room{h.vacantRooms === 1 ? "" : "s"}
                </span>
                <span>· {h.occupiedBeds}/{h.totalBeds} beds · {h.totalRooms} rooms</span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
