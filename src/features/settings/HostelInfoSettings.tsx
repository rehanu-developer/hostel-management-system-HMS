import type { SubmitHandler } from "react-hook-form"
import type { SettingsFormValues } from "@/lib/schemas"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { SettingsField } from "./SettingsField"
import { useSettingsForm } from "./useSettingsForm"
import type { Settings } from "@/types"

interface HostelInfoSettingsProps {
  settings: Settings
  onSave: (next: Settings) => void
  onDirtyChange: (dirty: boolean) => void
}

export function HostelInfoSettings({
  settings,
  onSave,
  onDirtyChange,
}: HostelInfoSettingsProps) {
  const form = useSettingsForm(settings, onDirtyChange)

  const onSubmit: SubmitHandler<SettingsFormValues> = (values) => {
    onSave({
      ...settings,
      hostelName: values.hostelName,
      hostelLocation: values.hostelLocation,
      hostelPhone: values.hostelPhone,
      hostelEmail: values.hostelEmail,
      hostelAddress: values.hostelAddress,
      hostelNotes: values.hostelNotes,
    })
    form.reset(values)
  }

  const isSubmitting = form.formState.isSubmitting
  const handleSubmit = form.handleSubmit(async (values) => {
    await new Promise((resolve) => setTimeout(resolve, 350))
    onSubmit(values)
  })

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SettingsField
              label="Hostel / Organization Name"
              description="The name used across the system for your hostel group."
              error={form.formState.errors.hostelName?.message}
            >
              <Input
                {...form.register("hostelName")}
                placeholder="Al-Noor Residency Group"
              />
            </SettingsField>

            <SettingsField
              label="Location"
              description="Main location of the hostel organization."
              error={form.formState.errors.hostelLocation?.message}
            >
              <Input
                {...form.register("hostelLocation")}
                placeholder="Block A, Main Boulevard"
              />
            </SettingsField>

            <SettingsField
              label="Phone"
              error={form.formState.errors.hostelPhone?.message}
            >
              <Input
                {...form.register("hostelPhone")}
                placeholder="+92 300 1234567"
              />
            </SettingsField>

            <SettingsField
              label="Email"
              error={form.formState.errors.hostelEmail?.message}
            >
              <Input
                {...form.register("hostelEmail")}
                type="email"
                placeholder="admin@hostel.pk"
              />
            </SettingsField>
          </div>

          <SettingsField
            label="Address"
            error={form.formState.errors.hostelAddress?.message}
          >
            <Textarea
              {...form.register("hostelAddress")}
              rows={2}
              placeholder="Plot 12, Block A, Main Boulevard, Lahore"
            />
          </SettingsField>

          <SettingsField
            label="Notes"
            description="Any internal notes about this hostel organization."
            error={form.formState.errors.hostelNotes?.message}
          >
            <Textarea
              {...form.register("hostelNotes")}
              rows={3}
              placeholder="Internal notes..."
            />
          </SettingsField>
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-end">
        <Button
          type="submit"
          disabled={!form.formState.isDirty}
          isSubmitting={isSubmitting}
        >
          {isSubmitting ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}
