import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDataStore } from "@/stores/dataStore"
import { SettingsNav, getSettingsLabel } from "./SettingsNav"
import { GeneralSettings } from "./GeneralSettings"
import { HostelInfoSettings } from "./HostelInfoSettings"
import { FeeSettings } from "./FeeSettings"
import { SystemPreferencesSettings } from "./SystemPreferencesSettings"
import { DataMaintenanceSettings } from "./DataMaintenanceSettings"
import { UnsavedChangesDialog } from "./UnsavedChangesDialog"
import { QrSettings } from "./QrSettings"
import type { Settings } from "@/types"

export type SettingsSection =
  | "general"
  | "hostel"
  | "fee"
  | "preferences"
  | "data"
  | "qr"

export function SettingsPage() {
  const settings = useDataStore((s) => s.settings)
  const updateSettings = useDataStore((s) => s.updateSettings)

  const [section, setSection] = useState<SettingsSection>("general")
  const [isDirty, setIsDirty] = useState(false)
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null)

  const handleSave = useCallback(
    (next: Settings) => {
      updateSettings(next)
      toast.success("Settings saved successfully")
      setIsDirty(false)
    },
    [updateSettings],
  )

  const handleSectionChange = (next: SettingsSection) => {
    if (section === next) return
    if (isDirty) {
      setPendingNav(() => () => setSection(next))
      return
    }
    setSection(next)
  }

  // beforeunload guard for browser-level navigation (close, refresh, nav away)
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  const handleConfirmLeave = () => {
    const nav = pendingNav
    setPendingNav(null)
    setIsDirty(false)
    if (nav) nav()
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage hostel information, fee defaults, and system preferences."
      />

      <div className="p-4 lg:p-6">
        {/* Mobile section selector */}
        <div className="mb-4 lg:hidden">
          <Select
            value={section}
            onValueChange={(v) => handleSectionChange(v as SettingsSection)}
          >
            <SelectTrigger className="h-9 w-full sm:w-[240px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="hostel">Hostel Information</SelectItem>
              <SelectItem value="fee">Fee Settings</SelectItem>
              <SelectItem value="preferences">System Preferences</SelectItem>
              <SelectItem value="data">Data & Maintenance</SelectItem>
              <SelectItem value="qr">Payment QR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
          {/* Desktop left nav */}
          <aside className="hidden lg:block">
            <div className="sticky top-16">
              <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                Sections
              </p>
              <SettingsNav section={section} onChange={handleSectionChange} />
            </div>
          </aside>

          {/* Right content */}
          <div className="min-w-0">
            <div className="mb-4">
              <h2 className="font-display text-lg font-semibold tracking-tight">
                {getSettingsLabel(section)}
              </h2>
              {section === "data" && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  Destructive actions — use with care.
                </p>
              )}
            </div>

            {section === "general" && (
              <GeneralSettings
                settings={settings}
                onSave={handleSave}
                onDirtyChange={setIsDirty}
              />
            )}
            {section === "hostel" && (
              <HostelInfoSettings
                settings={settings}
                onSave={handleSave}
                onDirtyChange={setIsDirty}
              />
            )}
            {section === "fee" && (
              <FeeSettings
                settings={settings}
                onSave={handleSave}
                onDirtyChange={setIsDirty}
              />
            )}
            {section === "preferences" && (
              <SystemPreferencesSettings
                settings={settings}
                onSave={handleSave}
                onDirtyChange={setIsDirty}
              />
            )}
            {section === "data" && (
              <DataMaintenanceSettings onReload={() => window.location.reload()} />
            )}
            {section === "qr" && <QrSettings />}
          </div>
        </div>
      </div>

      <UnsavedChangesDialog
        open={!!pendingNav}
        onOpenChange={(open) => !open && setPendingNav(null)}
        onConfirm={handleConfirmLeave}
      />
    </>
  )
}
