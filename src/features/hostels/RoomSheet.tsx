import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { RoomForm } from "./RoomForm"
import { useSheetCloseGuard } from "@/features/students/useSheetCloseGuard.tsx"
import type { Hostel, Room } from "@/types"

interface RoomSheetProps {
  mode: "add" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  room?: Room | null
  hostels: Hostel[]
  lockedHostelId?: string
  onSubmit: (values: {
    hostelId: string
    number: string
    capacity: number
    monthlyPrice: number
  }) => void
}

export function RoomSheet({
  mode,
  open,
  onOpenChange,
  room,
  hostels,
  lockedHostelId,
  onSubmit,
}: RoomSheetProps) {
  const [isDirty, setIsDirty] = useState(false)
  const { handleOpenChange, GuardDialog } = useSheetCloseGuard({
    open,
    onOpenChange,
    isDirty,
  })

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 sm:max-w-md"
        >
          <SheetHeader className="border-b border-[var(--border)] pb-4">
            <SheetTitle>
              {mode === "add" ? "Add Room" : "Edit Room"}
            </SheetTitle>
            <SheetDescription>
              {mode === "add"
                ? "Create a new room with 2 to 5 beds."
                : `Update Room ${room?.number ?? ""}.`}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-hidden py-4">
            <RoomForm
              defaultValues={room ?? undefined}
              hostels={hostels}
              lockedHostelId={lockedHostelId}
              onSubmit={onSubmit}
              onCancel={() => onOpenChange(false)}
              submitLabel={mode === "add" ? "Add Room" : "Save Changes"}
              onDirtyChange={setIsDirty}
            />
          </div>
        </SheetContent>
      </Sheet>
      {GuardDialog}
    </>
  )
}
