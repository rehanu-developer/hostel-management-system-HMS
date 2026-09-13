import type { SubmitHandler } from "react-hook-form"
import type { SettingsFormValues } from "@/lib/schemas"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SettingsField } from "./SettingsField"
import { useSettingsForm } from "./useSettingsForm"
import type { Settings } from "@/types"

interface GeneralSettingsProps {
  settings: Settings
  onSave: (next: Settings) => void
  onDirtyChange: (dirty: boolean) => void
}

const CURRENCIES = ["PKR", "INR", "USD", "EUR", "GBP", "AED", "SAR"]
const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
]

export function GeneralSettings({
  settings,
  onSave,
  onDirtyChange,
}: GeneralSettingsProps) {
  const form = useSettingsForm(settings, onDirtyChange)

  const onSubmit: SubmitHandler<SettingsFormValues> = (values) => {
    onSave({
      ...settings,
      systemName: values.systemName,
      description: values.description,
      currency: values.currency,
      dateFormat: values.dateFormat,
    })
    form.reset(values)
  }

  const isSubmitting = form.formState.isSubmitting
  const handleSubmit = form.handleSubmit(async (values) => {
    // Brief delay so the spinner is perceptible even on instant mock-data saves
    await new Promise((resolve) => setTimeout(resolve, 350))
    onSubmit(values)
  })

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="space-y-5 p-6">
          <SettingsField
            label="Application Name"
            description="Displayed throughout the system, including the dashboard."
            required
            error={form.formState.errors.systemName?.message}
          >
            <Input
              {...form.register("systemName")}
              placeholder="Hostel Management System"
            />
          </SettingsField>

          <SettingsField
            label="Description"
            description="Short description shown on the dashboard welcome message."
            error={form.formState.errors.description?.message}
          >
            <Textarea
              {...form.register("description")}
              rows={3}
              placeholder="Manage students, hostels, rooms, fees and visitors."
            />
          </SettingsField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SettingsField
              label="Default Currency"
              description="Used for fee amounts across the application."
              required
              error={form.formState.errors.currency?.message}
            >
              <Select
                value={form.watch("currency")}
                onValueChange={(v) =>
                  form.setValue("currency", v, { shouldDirty: true })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingsField>

            <SettingsField
              label="Date Format"
              description="How dates are displayed across the system."
              error={form.formState.errors.dateFormat?.message}
            >
              <Select
                value={form.watch("dateFormat")}
                onValueChange={(v) =>
                  form.setValue("dateFormat", v, { shouldDirty: true })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingsField>
          </div>
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
