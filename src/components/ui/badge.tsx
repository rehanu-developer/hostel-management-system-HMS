import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Solid (for status pills / KPI indicators)
        default:
          "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)]",
        success:
          "border-transparent bg-[var(--success)] text-[var(--success-foreground)]",
        warning:
          "border-transparent bg-[var(--warning)] text-[var(--warning-foreground)]",
        destructive:
          "border-transparent bg-[var(--destructive)] text-[var(--destructive-foreground)]",
        info:
          "border-transparent bg-[var(--info)] text-[var(--info-foreground)]",
        secondary:
          "border-transparent bg-[var(--secondary)] text-[var(--secondary-foreground)]",
        outline: "text-[var(--foreground)] border-[var(--border)]",
        muted:
          "border-transparent bg-[var(--muted)] text-[var(--muted-foreground)]",

        // Soft (pale bg, saturated text) — for table / inline use
        "success-soft":
          "border-transparent bg-[var(--success-soft)] text-[var(--success-soft-foreground)]",
        "warning-soft":
          "border-transparent bg-[var(--warning-soft)] text-[var(--warning-soft-foreground)]",
        "destructive-soft":
          "border-transparent bg-[var(--destructive-soft)] text-[var(--destructive-soft-foreground)]",
        "info-soft":
          "border-transparent bg-[var(--info-soft)] text-[var(--info-soft-foreground)]",
        "neutral-soft":
          "border-transparent bg-[var(--neutral-soft)] text-[var(--neutral-soft-foreground)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
