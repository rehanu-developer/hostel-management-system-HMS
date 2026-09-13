import { cn } from "@/lib/utils"
import type { SettingsSection } from "./SettingsPage"

interface SettingsNavProps {
  section: SettingsSection
  onChange: (s: SettingsSection) => void
  className?: string
}

const items: { id: SettingsSection; label: string }[] = [
  { id: "general", label: "General" },
  { id: "hostel", label: "Hostel Information" },
  { id: "fee", label: "Fee Settings" },
  { id: "preferences", label: "System Preferences" },
  { id: "data", label: "Data & Maintenance" },
]

export function SettingsNav({ section, onChange, className }: SettingsNavProps) {
  return (
    <nav className={cn("space-y-0.5", className)}>
      {items.map((item) => {
        const active = section === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "flex w-full items-center rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
              active
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]",
            )}
          >
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}

export function getSettingsLabel(id: SettingsSection): string {
  return items.find((i) => i.id === id)?.label ?? id
}
