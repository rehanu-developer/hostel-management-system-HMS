import type { VariantProps } from "class-variance-authority"
import { badgeVariants } from "@/components/ui/badge"

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>

export const visitorStatusVariant: Record<string, BadgeVariant> = {
  "Currently Visiting": "success-soft",
  "Checked Out": "neutral-soft",
}

export const paymentStatusVariant: Record<string, BadgeVariant> = {
  Paid: "success-soft",
  Pending: "warning-soft",
  "Partially Paid": "info-soft",
  Outstanding: "destructive-soft",
}

export const studentStatusVariant: Record<string, BadgeVariant> = {
  Active: "success-soft",
  Suspended: "destructive-soft",
  Left: "neutral-soft",
}

export const hostelStatusVariant: Record<string, BadgeVariant> = {
  Active: "success-soft",
  Inactive: "neutral-soft",
}

export const roomStatusVariant: Record<string, BadgeVariant> = {
  Available: "success-soft",
  "Partially Occupied": "warning-soft",
  Full: "destructive-soft",
}
