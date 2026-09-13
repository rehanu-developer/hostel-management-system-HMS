import { useMemo, useState } from "react"
import { Plus, Building2 } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { useDataStore, getHostelStats } from "@/stores/dataStore"
import { HostelCard, type HostelCardData } from "./HostelCard"
import { HostelSheet } from "./HostelSheet"
import { RoomSheet } from "./RoomSheet"
import { useNavigate } from "react-router-dom"
import type { Hostel } from "@/types"
import type { HostelFormValues } from "@/lib/schemas"

export function HostelsPage() {
  const navigate = useNavigate()
  const hostels = useDataStore((s) => s.hostels)
  const rooms = useDataStore((s) => s.rooms)
  const students = useDataStore((s) => s.students)
  const addHostel = useDataStore((s) => s.addHostel)
  const updateHostel = useDataStore((s) => s.updateHostel)
  const addRoom = useDataStore((s) => s.addRoom)

  const [addHostelOpen, setAddHostelOpen] = useState(false)
  const [editHostel, setEditHostel] = useState<Hostel | null>(null)

  // manage-rooms opens the room sheet pre-locked to that hostel
  const [manageRoomsFor, setManageRoomsFor] = useState<Hostel | null>(null)

  const cards: HostelCardData[] = useMemo(
    () => hostels.map((h) => getHostelStats(h, rooms, students)),
    [hostels, rooms, students],
  )

  const handleAddHostel = (values: HostelFormValues) => {
    addHostel(values)
    toast.success(`${values.name} added`)
    setAddHostelOpen(false)
  }

  const handleEditHostel = (values: HostelFormValues) => {
    if (editHostel) {
      updateHostel(editHostel.id, values)
      toast.success(`${values.name} updated`)
      setEditHostel(null)
    }
  }

  const handleDeactivate = (hostel: Hostel) => {
    const nextStatus = hostel.status === "Active" ? "Inactive" : "Active"
    updateHostel(hostel.id, { status: nextStatus })
    toast.success(`${hostel.name} ${nextStatus === "Active" ? "activated" : "deactivated"}`)
  }

  const handleManageRooms = (hostel: Hostel) => {
    setManageRoomsFor(hostel)
  }

  return (
    <>
      <PageHeader
        title="Hostels & Rooms"
        description="Manage hostel locations, rooms, beds and nomad accommodation."
        actions={
          <Button onClick={() => setAddHostelOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Hostel
          </Button>
        }
      />

      <div className="space-y-4 p-4 lg:p-6">
        {hostels.length === 0 ? (
          <EmptyHostelsState onAdd={() => setAddHostelOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((c) => (
              <HostelCard
                key={c.hostel.id}
                data={c}
                onEdit={(h) => setEditHostel(h)}
                onManageRooms={handleManageRooms}
                onDeactivate={handleDeactivate}
              />
            ))}
          </div>
        )}
      </div>

      <HostelSheet
        mode="add"
        open={addHostelOpen}
        onOpenChange={setAddHostelOpen}
        onSubmit={handleAddHostel}
      />

      <HostelSheet
        mode="edit"
        open={!!editHostel}
        onOpenChange={(open) => !open && setEditHostel(null)}
        hostel={editHostel}
        onSubmit={handleEditHostel}
      />

      <RoomSheet
        mode="add"
        open={!!manageRoomsFor}
        onOpenChange={(open) => !open && setManageRoomsFor(null)}
        hostels={hostels}
        lockedHostelId={manageRoomsFor?.id}
        onSubmit={(values) => {
          if (manageRoomsFor) {
            addRoom({
              hostelId: values.hostelId,
              number: values.number,
              capacity: values.capacity,
              monthlyPrice: values.monthlyPrice,
            })
            toast.success(`Room ${values.number} added`)
            navigate(`/hostels/${manageRoomsFor.id}`)
            setManageRoomsFor(null)
          }
        }}
      />
    </>
  )
}

function EmptyHostelsState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-[var(--border)] bg-[var(--card)] py-16 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
        <Building2 className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-display text-base font-semibold">
        No hostels yet
      </h3>
      <p className="mt-1 max-w-sm text-sm text-[var(--muted-foreground)]">
        Add a hostel to start managing rooms and beds.
      </p>
      <Button onClick={onAdd} className="mt-4">
        <Plus className="h-3.5 w-3.5" />
        Add Hostel
      </Button>
    </div>
  )
}
