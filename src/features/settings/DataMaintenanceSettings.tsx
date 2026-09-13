import { useState } from "react"
import { AlertTriangle, RotateCcw, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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

interface DataMaintenanceSettingsProps {
  onReload: () => void
}

export function DataMaintenanceSettings({
  onReload,
}: DataMaintenanceSettingsProps) {
  const [resetOpen, setResetOpen] = useState(false)

  const handleReset = () => {
    toast.info("Demo reset is not yet wired up", {
      description:
        "In a production build, this would reload the application data from defaults.",
    })
    onReload()
    setResetOpen(false)
  }

  return (
    <Card className="border-[var(--warning)]/40">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--warning-soft)] text-[var(--warning-soft-foreground)]">
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
          <CardTitle>Data & Maintenance</CardTitle>
        </div>
        <CardDescription>
          Destructive actions. Proceed with care.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-[var(--border)] bg-[var(--background)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-sm">Reset demo data</p>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                Reload the application with the original mock data set.
                Useful during demos and testing.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetOpen(true)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        </div>

        <div className="rounded-md border border-[var(--border)] bg-[var(--background)] p-4 opacity-60">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-sm">Clear all data</p>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                Permanently delete every student, room, payment and visitor
                record. This cannot be undone.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="text-[var(--destructive-soft-foreground)]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear All
            </Button>
          </div>
        </div>
      </CardContent>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader className="space-y-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--warning-soft)] text-[var(--warning-soft-foreground)]">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <AlertDialogTitle>Reset to demo data?</AlertDialogTitle>
              <AlertDialogDescription>
                This will replace all current students, rooms, payments and
                visitors with the original demo data set. Any changes you have
                made will be lost. This action cannot be undone.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-[var(--warning)] text-[var(--warning-foreground)] hover:opacity-90"
            >
              Reset demo data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
