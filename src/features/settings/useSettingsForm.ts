import { useEffect } from "react"
import { useForm, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { settingsSchema, type SettingsFormValues } from "@/lib/schemas"
import type { Settings } from "@/types"

export function useSettingsForm(
  settings: Settings,
  onDirtyChange: (dirty: boolean) => void,
) {
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settingsToFormValues(settings),
    mode: "onChange",
  })

  useEffect(() => {
    onDirtyChange(form.formState.isDirty)
  }, [form.formState.isDirty, form, onDirtyChange])

  return form
}

function settingsToFormValues(settings: Settings): SettingsFormValues {
  return {
    systemName: settings.systemName,
    description: settings.description,
    currency: settings.currency,
    dateFormat: settings.dateFormat,
    hostelName: settings.hostelName,
    hostelLocation: settings.hostelLocation,
    hostelPhone: settings.hostelPhone,
    hostelEmail: settings.hostelEmail,
    hostelAddress: settings.hostelAddress,
    hostelNotes: settings.hostelNotes,
    defaultMonthlyFee: settings.defaultMonthlyFee,
    defaultDueDay: settings.defaultDueDay,
    lateFee: settings.lateFee,
    showFeeNotifications: settings.showFeeNotifications,
    confirmBeforeDelete: settings.confirmBeforeDelete,
    showVisitorNotifications: settings.showVisitorNotifications,
  }
}

export function resetSection(
  form: UseFormReturn<SettingsFormValues>,
  settings: Settings,
  sectionFields: (keyof SettingsFormValues)[],
) {
  form.reset({
    ...settingsToFormValues(settings),
  })
  void sectionFields
}
