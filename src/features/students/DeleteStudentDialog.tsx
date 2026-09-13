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
import type { Student } from "@/types"

interface DeleteStudentDialogProps {
  student: Student | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (student: Student) => void
}

export function DeleteStudentDialog({
  student,
  open,
  onOpenChange,
  onConfirm,
}: DeleteStudentDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader className="space-y-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--destructive)]/10 text-[var(--destructive)]">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <AlertDialogTitle>Delete student record?</AlertDialogTitle>
            <AlertDialogDescription>
              {student ? (
                <>
                  You are about to permanently delete{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    {student.name}
                  </span>{" "}
                  ({student.studentCode}). This action cannot be undone.
                  Payment history and room history associated with this record
                  will also be removed.
                </>
              ) : null}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => student && onConfirm(student)}
          >
            Delete student
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
