import { useCallback, useEffect, useState } from "react"
import { UnsavedChangesDialog } from "@/features/settings/UnsavedChangesDialog"

interface UseSheetCloseGuardOptions {
  open: boolean
  onOpenChange: (open: boolean) => void
  isDirty: boolean
}

/**
 * Wraps a Sheet's open/onOpenChange so that closing while the form is
 * dirty shows a confirmation dialog instead of discarding silently.
 */
export function useSheetCloseGuard({
  open,
  onOpenChange,
  isDirty,
}: UseSheetCloseGuardOptions) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next && isDirty) {
        setConfirmOpen(true)
        return
      }
      onOpenChange(next)
    },
    [isDirty, onOpenChange],
  )

  // When the parent sets `open=false` externally (e.g. successful submit),
  // close any lingering confirmation dialog too.
  useEffect(() => {
    if (!open) setConfirmOpen(false)
  }, [open])

  const GuardDialog = (
    <UnsavedChangesDialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      onConfirm={() => {
        setConfirmOpen(false)
        onOpenChange(false)
      }}
    />
  )

  return { handleOpenChange, GuardDialog }
}
