import type { SubmitHandler } from "react-hook-form"
import type { SettingsFormValues } from "@/lib/schemas"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useSettingsForm } from "./useSettingsForm"
import type { Settings } from "@/types"

interface SystemPreferencesSettingsProps {
  settings: Settings
  onSave: (next: Settings) => void
  onDirtyChange: (dirty: boolean) => void
}

interface PreferenceRow {
  key: keyof Pick<
    Settings,
    "showFeeNotifications" | "confirmBeforeDelete" | "showVisitorNotifications"
  >
  title: string
  description: string
}

const PREFERENCES: PreferenceRow[] = [
  {
    key: "showFeeNotifications",
    title: "Show Fee Notifications",
    description:
      "Surface students with pending or outstanding fees in dashboard notifications.",
  },
  {
    key: "confirmBeforeDelete",
    title: "Confirm Before Deleting Records",
    description:
      "Ask for confirmation before permanently deleting student or room records.",
  },
  {
    key: "showVisitorNotifications",
    title: "Show Visitor Notifications",
    description:
      "Surface active visitor check-ins in the dashboard summary. WhatsApp/SMS automation is not supported in this version.",
  },
]

export function SystemPreferencesSettings({
  settings,
  onSave,
  onDirtyChange,
}: SystemPreferencesSettingsProps) {
  const form = useSettingsForm(settings, onDirtyChange)

  const onSubmit: SubmitHandler<SettingsFormValues> = (values) => {
    onSave({
      ...settings,
      showFeeNotifications: values.showFeeNotifications,
      confirmBeforeDelete: values.confirmBeforeDelete,
      showVisitorNotifications: values.showVisitorNotifications,
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
        <CardContent className="p-0">
          <ul className="divide-y divide-[var(--border)]">
            {PREFERENCES.map((pref) => (
              <li
                key={pref.key}
                className="flex items-start justify-between gap-4 p-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{pref.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                    {pref.description}
                  </p>
                </div>
                <Switch
                  checked={form.watch(pref.key)}
                  onCheckedChange={(checked) =>
                    form.setValue(pref.key, checked, { shouldDirty: true })
                  }
                  aria-label={pref.title}
                />
              </li>
            ))}
          </ul>
          <Separator />
          <div className="px-5 py-4 text-xs text-[var(--muted-foreground)]">
            <p>
              Preferences control in-app behavior only. WhatsApp/SMS automation,
              email notifications and online payments are not supported in this
              version.
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
