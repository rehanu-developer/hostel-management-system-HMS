import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Student, StudentStatus } from "@/types"

interface ChangeStatusDialogProps {
  student: Student | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (student: Student, status: StudentStatus, checkOut?: string) => void
}

export function ChangeStatusDialog({
  student,
  open,
  onOpenChange,
  onConfirm,
}: ChangeStatusDialogProps) {
  const [status, setStatus] = useState<StudentStatus>("Active")
  const [checkOut, setCheckOut] = useState<Date | undefined>(undefined)

  useEffect(() => {
    if (student) {
      setStatus(student.status)
      setCheckOut(
        student.checkOut ? new Date(student.checkOut) : undefined,
      )
    }
  }, [student])

  if (!student) return null

  const handleConfirm = () => {
    onConfirm(
      student,
      status,
      status === "Left" ? checkOut?.toISOString().slice(0, 10) : undefined,
    )
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Status</DialogTitle>
          <DialogDescription>
            Update the status of{" "}
            <span className="font-medium text-[var(--foreground)]">
              {student.name}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="status-select">New status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as StudentStatus)}
            >
              <SelectTrigger id="status-select" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Left">Left</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === "Left" && (
            <div className="space-y-1.5">
              <Label>Check-out date</Label>
              <DatePicker
                value={checkOut}
                onChange={setCheckOut}
                placeholder="Select date"
              />
              <p className="text-xs text-[var(--muted-foreground)]">
                The bed assigned to this student will become available.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Update Status</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
