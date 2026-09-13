import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { StudentForm } from "./StudentForm"
import { useSheetCloseGuard } from "./useSheetCloseGuard.tsx"
import type { StudentFormValues } from "@/lib/schemas"
import type { Hostel, Room, Student } from "@/types"

interface StudentSheetProps {
  mode: "add" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: Student | null
  hostels: Hostel[]
  rooms: Room[]
  students: Student[]
  onSubmit: (values: StudentFormValues) => void
}

export function StudentSheet({
  mode,
  open,
  onOpenChange,
  student,
  hostels,
  rooms,
  students,
  onSubmit,
}: StudentSheetProps) {
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
          className="flex w-full flex-col gap-0 sm:max-w-xl"
        >
          <SheetHeader className="border-b border-[var(--border)] pb-4">
            <SheetTitle>
              {mode === "add" ? "Add Nomad" : "Edit Nomad"}
            </SheetTitle>
            <SheetDescription>
              {mode === "add"
                ? "Record a new student and assign them to a room."
                : `Update details for ${student?.name ?? "this student"}.`}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-hidden py-4">
            <StudentForm
              defaultValues={student ?? undefined}
              hostels={hostels}
              rooms={rooms}
              students={students}
              excludeStudentId={student?.id}
              onSubmit={onSubmit}
              onCancel={() => onOpenChange(false)}
              submitLabel={mode === "add" ? "Add Nomad" : "Save Changes"}
              onDirtyChange={setIsDirty}
            />
          </div>
        </SheetContent>
      </Sheet>
      {GuardDialog}
    </>
  )
}
