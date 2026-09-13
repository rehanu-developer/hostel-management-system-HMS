import type { SubmitHandler } from "react-hook-form"
import type { SettingsFormValues } from "@/lib/schemas"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { useDataStore } from "@/stores/dataStore"
import { formatCurrency } from "@/lib/utils"
import type { Settings } from "@/types"

interface FeeSettingsProps {
  settings: Settings
  onSave: (next: Settings) => void
  onDirtyChange: (dirty: boolean) => void
}

const DUE_DAYS = Array.from({ length: 28 }, (_, i) => i + 1)

export function FeeSettings({ settings, onSave, onDirtyChange }: FeeSettingsProps) {
  const form = useSettingsForm(settings, onDirtyChange)
  const currency = useDataStore((s) => s.settings.currency)

  const onSubmit: SubmitHandler<SettingsFormValues> = (values) => {
    onSave({
      ...settings,
      defaultMonthlyFee: values.defaultMonthlyFee,
      defaultDueDay: values.defaultDueDay,
      lateFee: values.lateFee,
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
          <SettingsField
            label="Default Monthly Fee"
            description={`Base monthly fee used when adding new students. Currently ${formatCurrency(settings.defaultMonthlyFee, currency)}.`}
            required
            error={form.formState.errors.defaultMonthlyFee?.message}
          >
            <Input
              type="number"
              min={0}
              {...form.register("defaultMonthlyFee", { valueAsNumber: true })}
              placeholder="15000"
            />
          </SettingsField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SettingsField
              label="Default Due Day"
              description="Day of the month when fees become due."
              required
              error={form.formState.errors.defaultDueDay?.message}
            >
              <Select
                value={String(form.watch("defaultDueDay"))}
                onValueChange={(v) =>
                  form.setValue("defaultDueDay", Number(v), {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DUE_DAYS.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d}
                      {d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th"} of the month
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingsField>

            <SettingsField
              label="Late Fee"
              description={`Optional surcharge applied for late payments. Currently ${formatCurrency(settings.lateFee, currency)}.`}
              error={form.formState.errors.lateFee?.message}
            >
              <Input
                type="number"
                min={0}
                {...form.register("lateFee", { valueAsNumber: true })}
                placeholder="500"
              />
            </SettingsField>
          </div>

          <div className="rounded-md border border-[var(--border)] bg-[var(--muted)]/30 p-4 text-xs text-[var(--muted-foreground)]">
            <p className="font-medium text-[var(--foreground)]">Payment states</p>
            <p className="mt-1">
              The system supports four payment states:
              <span className="ml-1 font-medium text-[var(--success-soft-foreground)]">Paid</span>,
              <span className="ml-1 font-medium text-[var(--warning-soft-foreground)]">Pending</span>,
              <span className="ml-1 font-medium text-[var(--info-soft-foreground)]">Partially Paid</span>,
              and
              <span className="ml-1 font-medium text-[var(--destructive-soft-foreground)]">Outstanding</span>.
              Automatic late-fee calculation is not performed; these amounts are recorded manually by the manager.
            </p>
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
