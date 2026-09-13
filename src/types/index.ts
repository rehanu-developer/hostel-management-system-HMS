export type StudentStatus = "Active" | "Left" | "Suspended"
export type PaymentStatus = "Paid" | "Pending" | "Partially Paid" | "Outstanding"
export type Relationship = "Friend" | "Family Member" | "Other" | null
export type VisitorStatus = "Currently Visiting" | "Checked Out"
export type PaymentType = "accommodation" | "visitor"
export type VisitorKind = "linked" | "independent"

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
  /** Total fee expected for this period. Independent of how much has been paid. */
  amount: number
  /** Running total of payments made toward this fee. 0 ≤ paid ≤ amount. */
  paid?: number
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
  /**
   * Linked visitor: the hostel member being visited (required).
   * Independent visitor: undefined — the visitor is financially responsible for themselves.
   */
  studentId?: string
  /** Required for independent visitors (and always set, even for linked). */
  hostelId: string
  /** For linked visitors, derived from student's current room. For independent, optional. */
  roomId?: string
  /** Linked visitors must carry a relationship to the student. Independent may use "Other". */
  relationship: Relationship
  /** Linked = assigned to a student (student pays). Independent = self-pay. */
  kind: VisitorKind
  checkIn: string // ISO datetime
  expectedCheckOut: string // ISO datetime
  actualCheckOut?: string // ISO datetime — present when checked out
  nights: number // expected stay
  perNight: number // PKR / night
  /** Total charge for the stay. Independent of how much has been paid. */
  total: number
  /** Running total of payments made toward this stay. 0 ≤ paid ≤ total. */
  paid?: number
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
  /**
   * The negotiated monthly price for THIS room assignment.
   * Falls back to room.monthlyPrice when not provided.
   * Different students in the same room may have different agreed prices.
   */
  agreedMonthlyPrice?: number
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
