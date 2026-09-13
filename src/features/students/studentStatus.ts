import type { StudentStatus, PaymentStatus } from "@/types"

export const studentStatusLabel: Record<StudentStatus, string> = {
  Active: "Active",
  Left: "Left",
  Suspended: "Suspended",
}

export const studentStatusVariant: Record<
  StudentStatus,
  "success-soft" | "neutral-soft" | "destructive-soft"
> = {
  Active: "success-soft",
  Left: "neutral-soft",
  Suspended: "destructive-soft",
}

export const paymentStatusVariant: Record<
  PaymentStatus,
  "success-soft" | "warning-soft" | "destructive-soft" | "info-soft" | "muted"
> = {
  Paid: "success-soft",
  Pending: "warning-soft",
  "Partially Paid": "info-soft",
  Outstanding: "destructive-soft",
}
