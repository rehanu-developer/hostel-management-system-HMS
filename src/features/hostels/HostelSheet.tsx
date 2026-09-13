import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { HostelForm } from "./HostelForm"
import { useSheetCloseGuard } from "@/features/students/useSheetCloseGuard.tsx"
import type { HostelFormValues } from "@/lib/schemas"
import type { Hostel } from "@/types"

interface HostelSheetProps {
  mode: "add" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  hostel?: Hostel | null
  onSubmit: (values: HostelFormValues) => void
}

export function HostelSheet({
  mode,
  open,
  onOpenChange,
  hostel,
  onSubmit,
}: HostelSheetProps) {
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
              {mode === "add" ? "Add Hostel" : "Edit Hostel"}
            </SheetTitle>
            <SheetDescription>
              {mode === "add"
                ? "Create a new hostel location to begin managing rooms."
                : `Update details for ${hostel?.name ?? "this hostel"}.`}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-hidden py-4">
            <HostelForm
              defaultValues={hostel ?? undefined}
              onSubmit={onSubmit}
              onCancel={() => onOpenChange(false)}
              submitLabel={mode === "add" ? "Add Hostel" : "Save Changes"}
              onDirtyChange={setIsDirty}
            />
          </div>
        </SheetContent>
      </Sheet>
      {GuardDialog}
    </>
  )
}
