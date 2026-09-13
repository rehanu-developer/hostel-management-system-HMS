import type { Hostel } from "@/types"

export const hostelStatusVariant: Record<
  Hostel["status"],
  "success-soft" | "neutral-soft"
> = {
  Active: "success-soft",
  Inactive: "neutral-soft",
}

export type RoomStatus = "Available" | "Partially Occupied" | "Full"

export const roomStatusVariant: Record<
  RoomStatus,
  "success-soft" | "warning-soft" | "destructive-soft"
> = {
  Available: "success-soft",
  "Partially Occupied": "warning-soft",
  Full: "destructive-soft",
}
