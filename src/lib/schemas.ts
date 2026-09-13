import { z } from "zod"

export const studentStatusEnum = z.enum(["Active", "Left", "Suspended"])
export const paymentStatusEnum = z.enum([
  "Paid",
  "Pending",
  "Partially Paid",
  "Outstanding",
])
export const relationshipEnum = z
  .enum(["Friend", "Family Member", "Other"])
  .nullable()

export const familyMemberSchema = z.object({
  name: z.string().min(1, "Name required"),
  phone: z.string().min(7, "Valid phone required"),
  cnic: z.string().min(5, "CNIC required"),
  relation: z.string().min(1, "Relation required"),
})

export const studentSchema = z.object({
  studentCode: z.string().min(1, "Student ID required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(7, "Valid phone required"),
  email: z.string(),
  cnic: z.string().min(5, "CNIC required"),
  address: z.string(),
  bio: z.string().min(1, "City/location required"),
  status: studentStatusEnum,
  hostelId: z.string().min(1, "Hostel required"),
  roomId: z.string().min(1, "Room required"),
  bedLabel: z.string().min(1, "Bed required"),
  checkIn: z.string().min(1, "Check-in date required"),
  checkOut: z.string().optional(),
  referencePerson: z.string(),
  familyMember: familyMemberSchema.nullable(),
  notes: z.string(),
})

export type StudentFormValues = z.infer<typeof studentSchema>

export const hostelSchema = z.object({
  name: z.string().min(2, "Name required"),
  location: z.string().min(2, "Location required"),
  status: z.enum(["Active", "Inactive"]),
  notes: z.string(),
})

export type HostelFormValues = z.infer<typeof hostelSchema>

export const roomSchema = z.object({
  hostelId: z.string().min(1, "Hostel required"),
  number: z.string().min(1, "Room number required"),
  capacity: z.number().int().min(2).max(5),
  monthlyPrice: z
    .number({ invalid_type_error: "Enter a valid amount" })
    .min(0, "Must be 0 or greater"),
})

export const visitorSchema = z.object({
  name: z.string().min(2, "Visitor name required"),
  phone: z.string().min(7, "Valid phone required"),
  cnic: z.string().min(5, "CNIC/ID required"),
  studentId: z.string().min(1, "Hostel member required"),
  relationship: relationshipEnum,
  checkIn: z.string().min(1, "Check-in required"),
  expectedCheckOut: z.string().min(1, "Expected check-out required"),
  nights: z.number().int().min(1, "Must be at least 1 night"),
  perNight: z.number().min(0, "Must be 0 or greater"),
  notes: z.string().optional(),
})

export const paymentSchema = z.object({
  studentId: z.string().min(1, "Student required"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM"),
  amount: z.number().min(0),
  status: paymentStatusEnum,
  paidDate: z.string().optional(),
})

export const settingsSchema = z.object({
  systemName: z.string().min(1, "Application name required"),
  description: z.string(),
  currency: z.string().min(1),
  dateFormat: z.string().min(1),
  hostelName: z.string(),
  hostelLocation: z.string(),
  hostelPhone: z.string(),
  hostelEmail: z.string().email("Enter a valid email").or(z.literal("")),
  hostelAddress: z.string(),
  hostelNotes: z.string(),
  defaultMonthlyFee: z.number().min(0, "Must be 0 or greater"),
  defaultDueDay: z.number().int().min(1).max(31, "Must be between 1 and 31"),
  lateFee: z.number().min(0, "Must be 0 or greater"),
  showFeeNotifications: z.boolean(),
  confirmBeforeDelete: z.boolean(),
  showVisitorNotifications: z.boolean(),
})

export type SettingsFormValues = z.infer<typeof settingsSchema>

export type RoomFormValues = z.infer<typeof roomSchema>
export type VisitorFormValues = z.infer<typeof visitorSchema>
