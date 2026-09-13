import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SettingsFieldProps {
  label: string
  description?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export function SettingsField({
  label,
  description,
  error,
  required,
  children,
  className,
}: SettingsFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="flex items-center gap-1 text-sm font-medium leading-none">
        {label}
        {required && (
          <span className="text-[var(--destructive-soft-foreground)]">*</span>
        )}
      </label>
      {children}
      {description && !error && (
        <p className="text-xs text-[var(--muted-foreground)]">{description}</p>
      )}
      {error && (
        <p className="text-xs font-medium text-[var(--destructive-soft-foreground)]">
          {error}
        </p>
      )}
    </div>
  )
}
