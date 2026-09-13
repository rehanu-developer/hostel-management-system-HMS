import type {
  Hostel,
  Payment,
  PaymentStatus,
  PaymentType,
  Room,
  Student,
  Visitor,
} from "@/types"

export type FinanceRowType = PaymentType // "accommodation" | "visitor"

export interface AccommodationFinanceRow {
  id: string
  type: "accommodation"
  studentId: string
  studentName: string
  studentCode: string
  hostel: Hostel | undefined
  hostelId: string
  hostelName: string
  room: Room | undefined
  roomNumber: string
  month: string
  description: string
  amount: number // total fee expected
  paid: number // amount already paid
  remaining: number
  status: PaymentStatus
  paidDate: string | null
  receiptImage?: string
}

export interface VisitorFinanceRow {
  id: string
  type: "visitor"
  /** Linked: the responsible hostel member. Independent: undefined. */
  studentId: string | undefined
  studentName: string
  studentCode: string
  hostel: Hostel | undefined
  hostelId: string
  hostelName: string
  room: Room | undefined
  roomNumber: string
  visitorId: string
  visitorName: string
  description: string
  amount: number // total charge
  paid: number
  remaining: number
  status: PaymentStatus
  paidDate: string | null
  /** "linked" or "independent" — drives the Student column rendering. */
  kind: "linked" | "independent"
}

export type FinanceRow = AccommodationFinanceRow | VisitorFinanceRow

export function paidAmount(payment: Payment): number {
  // Use the `paid` field when present (post-fix data). Otherwise derive
  // conservatively from status for backward compat with older data.
  if (payment.paid !== undefined) return payment.paid
  if (payment.status === "Paid") return payment.amount
  return 0
}

export function computeRemaining(total: number, paid: number): number {
  return Math.max(0, total - paid)
}

export function visitorPaid(v: Visitor): number {
  if (v.paid !== undefined) return v.paid
  if (v.paymentStatus === "Paid") return v.total
  return 0
}

/** Project all payment + visitor data into a unified row shape. */
export function projectFinanceRows(
  payments: Payment[],
  visitors: Visitor[],
  students: Student[],
  rooms: Room[],
  hostels: Hostel[],
): FinanceRow[] {
  const studentById = new Map(students.map((s) => [s.id, s]))
  const hostelById = new Map(hostels.map((h) => [h.id, h]))
  const roomById = new Map(rooms.map((r) => [r.id, r]))

  const accommodation: AccommodationFinanceRow[] = payments
    .filter((p) => (p.type ?? "accommodation") === "accommodation")
    .map((p) => {
      const student = studentById.get(p.studentId)
      const room = student ? roomById.get(student.roomId) : undefined
      const hostel = student ? hostelById.get(student.hostelId) : undefined
      const paid = paidAmount(p)
      return {
        id: p.id,
        type: "accommodation",
        studentId: p.studentId,
        studentName: student?.name ?? "—",
        studentCode: student?.studentCode ?? "—",
        hostel,
        hostelId: student?.hostelId ?? "",
        hostelName: hostel?.name ?? "—",
        room,
        roomNumber: room?.number ?? "—",
        month: p.month,
        description: formatMonth(p.month),
        amount: p.amount,
        paid,
        remaining: computeRemaining(p.amount, paid),
        status: p.status,
        paidDate: p.paidDate ?? null,
        ...(p.receiptImage !== undefined ? { receiptImage: p.receiptImage } : {}),
      }
    })

  const visitorRows: VisitorFinanceRow[] = visitors.map((v) => {
    const student = v.studentId ? studentById.get(v.studentId) : undefined
    const hostel = hostelById.get(v.hostelId)
    const room = v.roomId ? roomById.get(v.roomId) : undefined
    const paid = visitorPaid(v)
    const month = v.checkIn.slice(0, 7)
    return {
      id: v.id,
      type: "visitor",
      studentId: v.studentId,
      studentName:
        v.kind === "independent" ? "Independent Visitor" : (student?.name ?? "—"),
      studentCode: v.kind === "independent" ? "—" : (student?.studentCode ?? "—"),
      hostel,
      hostelId: v.hostelId,
      hostelName: hostel?.name ?? "—",
      room,
      roomNumber: room?.number ?? "—",
      visitorId: v.id,
      visitorName: v.name,
      description: v.name,
      amount: v.total,
      paid,
      remaining: computeRemaining(v.total, paid),
      status: v.paymentStatus,
      paidDate: v.paidDate ?? (v.paymentStatus === "Paid" ? v.checkIn : null),
      kind: v.kind,
    }
  })

  return [...accommodation, ...visitorRows]
}

export interface FinanceSummary {
  collected: number
  outstanding: number
  pendingStudents: number
  expected: number
  totalRecords: number
}

export function summarize(
  rows: FinanceRow[],
  paymentsForExpected: Payment[],
): FinanceSummary {
  const collected = rows
    .filter((r) => r.status === "Paid")
    .reduce((sum, r) => sum + r.paid, 0)
  const outstanding = rows.reduce(
    (sum, r) =>
      sum + (r.status === "Paid" ? 0 : r.remaining),
    0,
  )
  const pendingStudents = new Set(
    rows
      .filter(
        (r) =>
          r.type === "accommodation" &&
          r.status !== "Paid",
      )
      .map((r) => r.studentId),
  ).size
  // Expected accommodation revenue = sum of fee amounts (always the full fee now,
  // independent of payment status) in the row scope. Visitor charges are
  // counted separately, NOT as accommodation revenue (per spec).
  const expected = paymentsForExpected
    .filter((p) => (p.type ?? "accommodation") === "accommodation")
    .reduce((sum, p) => sum + p.amount, 0)
  return {
    collected,
    outstanding,
    pendingStudents,
    expected,
    totalRecords: rows.length,
  }
}

function formatMonth(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  })
}

export function applyFinanceFilters(
  rows: FinanceRow[],
  filters: FinanceFilters,
  studentById: Map<string, Student>,
): FinanceRow[] {
  return rows.filter((r) => {
    if (filters.type !== "all" && r.type !== filters.type) return false
    if (filters.status !== "all" && r.status !== filters.status) return false
    if (filters.hostelId !== "all" && r.hostelId !== filters.hostelId)
      return false
    if (filters.month !== "all" && r.month !== filters.month) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const hay = [
        r.studentName,
        r.studentCode,
        r.hostelName,
        r.roomNumber,
        "type" in r ? (r as VisitorFinanceRow).visitorName : "",
        r.description,
      ]
        .join(" ")
        .toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (filters.rangeFrom) {
      const monthTs = new Date(r.month + "-01").getTime()
      if (monthTs < new Date(filters.rangeFrom).getTime()) return false
    }
    if (filters.rangeTo) {
      const monthTs = new Date(r.month + "-01").getTime()
      const endOfMonth = new Date(r.month + "-01")
      endOfMonth.setMonth(endOfMonth.getMonth() + 1)
      endOfMonth.setDate(0)
      if (endOfMonth.getTime() > new Date(filters.rangeTo).getTime()) return false
    }
    return true
  })
}

export interface FinanceFilters {
  search: string
  type: FinanceRowType | "all"
  status: PaymentStatus | "all"
  hostelId: string
  month: string
  rangeFrom: string
  rangeTo: string
}

export const EMPTY_FINANCE_FILTERS: FinanceFilters = {
  search: "",
  type: "all",
  status: "all",
  hostelId: "all",
  month: "all",
  rangeFrom: "",
  rangeTo: "",
}

export function isFinanceFilterActive(f: FinanceFilters): boolean {
  return (
    f.search !== "" ||
    f.type !== "all" ||
    f.status !== "all" ||
    f.hostelId !== "all" ||
    f.month !== "all" ||
    f.rangeFrom !== "" ||
    f.rangeTo !== ""
  )
}
