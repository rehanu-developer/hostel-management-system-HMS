import { AlertTriangle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Room } from "@/types"

interface DeleteRoomDialogProps {
  room: Room | null
  hostelName?: string
  occupiedCount: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (room: Room) => void
}

export function DeleteRoomDialog({
  room,
  hostelName,
  occupiedCount,
  open,
  onOpenChange,
  onConfirm,
}: DeleteRoomDialogProps) {
  const hasOccupants = occupiedCount > 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader className="space-y-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--destructive)]/10 text-[var(--destructive)]">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <AlertDialogTitle>Delete room?</AlertDialogTitle>
            <AlertDialogDescription>
              {room ? (
                <>
                  You are about to permanently delete{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    Room {room.number}
                    {hostelName ? ` (${hostelName})` : ""}
                  </span>
                  .
                  {hasOccupants ? (
                    <>
                      <br />
                      <br />
                      This room currently has{" "}
                      <span className="font-medium text-[var(--foreground)]">
                        {occupiedCount} student
                        {occupiedCount === 1 ? "" : "s"}
                      </span>{" "}
                      assigned. Move them to another room first to avoid
                      breaking their records.
                    </>
                  ) : (
                    <>
                      This room is empty and will be removed permanently. This
                      action cannot be undone.
                    </>
                  )}
                </>
              ) : null}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={hasOccupants}
            onClick={() => room && !hasOccupants && onConfirm(room)}
            className={hasOccupants ? "pointer-events-none opacity-50" : undefined}
          >
            Delete room
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
