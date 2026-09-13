export type StudentStatus = "Active" | "Left" | "Suspended"
export type PaymentStatus = "Paid" | "Pending" | "Partially Paid" | "Outstanding"
export type Relationship = "Friend" | "Family Member" | "Other" | null
export type VisitorStatus = "Currently Visiting" | "Checked Out"
export type PaymentType = "accommodation" | "visitor"

export interface Hostel {
  id: string
  name: string
  location: string
  status: "Active" | "Inactive"
  notes?: string
}

export interface Room {
  id: string
  hostelId: string
  number: string
  capacity: number // 2-5
  monthlyPrice: number // PKR, persisted source of truth for student fee
}

export interface RoommateRef {
  id: string
  name: string
}

export interface FamilyMember {
  name: string
  phone: string
  cnic: string
  relation: string
}

export interface Student {
  id: string
  studentCode: string // human-readable ID like STU-1024
  name: string
  phone: string
  email: string
  cnic: string
  cnicImage?: string
  bio: string // city/where they came from
  address: string // street/home address
  status: StudentStatus
  hostelId: string
  roomId: string
  bedLabel: string
  checkIn: string
  checkOut?: string
  referencePerson: string
  familyMember: FamilyMember | null
  notes: string
  monthlyFee?: number // negotiated override; falls back to room.monthlyPrice
}

export interface Payment {
  id: string
  studentId: string
  month: string // YYYY-MM
  amount: number
  paidDate?: string
  status: PaymentStatus
  receiptImage?: string
  type?: PaymentType // defaults to "accommodation"
}

export interface Visitor {
  id: string
  name: string
  phone: string
  cnic: string
  studentId: string // hostel member being visited
  roomId: string // derived from student's current room
  relationship: Relationship
  checkIn: string // ISO datetime
  expectedCheckOut: string // ISO datetime
  actualCheckOut?: string // ISO datetime — present when checked out
  nights: number // expected stay
  perNight: number // PKR / night
  total: number // PKR total for the stay
  status: VisitorStatus
  paymentStatus: PaymentStatus
  notes?: string
}

export interface RoomHistoryEntry {
  id: string
  studentId: string
  hostelId: string
  roomId: string
  bedLabel: string
  from: string
  to?: string
  reason?: string // optional, e.g. "Room change"
}

export interface Settings {
  // General
  systemName: string
  description: string
  currency: string
  dateFormat: string
  // Hostel information
  hostelName: string
  hostelLocation: string
  hostelPhone: string
  hostelEmail: string
  hostelAddress: string
  hostelNotes: string
  // Fee settings
  defaultMonthlyFee: number
  defaultDueDay: number
  lateFee: number
  // System preferences
  showFeeNotifications: boolean
  confirmBeforeDelete: boolean
  showVisitorNotifications: boolean
}
