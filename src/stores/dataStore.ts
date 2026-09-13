import { create } from "zustand"
import type {
  Hostel,
  Room,
  Student,
  Payment,
  Visitor,
  RoomHistoryEntry,
  Settings,
  PaymentType,
} from "@/types"
import {
  mockHostels,
  mockRooms,
  mockStudents,
  mockPayments,
  mockVisitors,
  mockRoomHistory,
  mockSettings,
} from "@/lib/mock/data"
import { currentMonthKey } from "@/lib/utils"

interface DataState {
  hostels: Hostel[]
  rooms: Room[]
  students: Student[]
  payments: Payment[]
  visitors: Visitor[]
  roomHistory: RoomHistoryEntry[]
  settings: Settings

  // Hostels
  addHostel: (h: Omit<Hostel, "id">) => void
  updateHostel: (id: string, h: Partial<Hostel>) => void
  deleteHostel: (id: string) => void

  // Rooms
  addRoom: (r: Omit<Room, "id">) => void
  updateRoom: (id: string, r: Partial<Room>) => void
  deleteRoom: (id: string) => void

  // Students
  addStudent: (s: Omit<Student, "id">) => string
  updateStudent: (id: string, s: Partial<Student>) => void
  deleteStudent: (id: string) => void
  changeStudentStatus: (id: string, status: Student["status"], checkOut?: string) => void
  assignStudent: (
    studentId: string,
    hostelId: string,
    roomId: string,
    bedLabel: string,
    agreedMonthlyPrice?: number,
  ) => void
  changeStudentRoom: (
    studentId: string,
    hostelId: string,
    roomId: string,
    bedLabel: string,
    agreedMonthlyPrice?: number,
  ) => void
  getNextStudentCode: () => string
  /** Returns the agreed monthly price for the student's currently-open room assignment. */
  getAgreedMonthlyPrice: (studentId: string) => number

  // Payments
  recordPayment: (p: Omit<Payment, "id">) => void
  recordStudentPayment: (args: {
    studentId: string
    month: string
    delta: number
    paidDate: string
    receiptImage?: string
  }) => void
  updatePayment: (id: string, p: Partial<Payment>) => void
  recordVisitorPaymentAmount: (args: {
    visitorId: string
    delta: number
    paidDate: string
  }) => void

  // Visitors
  checkInVisitor: (v: Omit<Visitor, "id" | "actualCheckOut">) => void
  checkOutVisitor: (id: string) => void
  updateVisitor: (id: string, patch: Partial<Visitor>) => void
  recordVisitorPayment: (id: string, status: Payment["status"]) => void

  /** Returns the effective hostel/room/bed for a visitor's charge row. */
  getVisitorChargeContext: (visitorId: string) => {
    hostelId: string
    hostelName: string
    roomNumber: string
    studentName: string
    studentCode: string
    kind: Visitor["kind"]
  }

  // Settings
  updateSettings: (s: Partial<Settings>) => void
}

/** Idempotently create / update the current-month accommodation fee for a student. */
function ensureCurrentMonthFee(
  payments: Payment[],
  studentId: string,
  amount: number,
  month: string,
): Payment[] {
  const id = `p-${studentId}-${month}`
  const existing = payments.find(
    (p) => p.studentId === studentId && p.month === month,
  )
  if (!existing) {
    return [
      ...payments,
      {
        id,
        studentId,
        month,
        amount,
        paid: 0,
        status: "Pending",
        type: "accommodation" as PaymentType,
      },
    ]
  }
  // Existing fee: only update the total when no payment has been made yet.
  // Historical fees with any `paid > 0` are frozen (per spec: "room price changes
  // must not rewrite historical financial records").
  const paidSoFar = existing.paid ?? 0
  if (paidSoFar === 0 && existing.amount !== amount) {
    return payments.map((p) =>
      p.id === existing.id ? { ...p, amount } : p,
    )
  }
  return payments
}

/**
 * Resolve the agreed monthly price for a student at a given point in time:
 *   1. Open RoomHistoryEntry with `agreedMonthlyPrice` → use it
 *   2. Open RoomHistoryEntry without override → use room's monthlyPrice
 *   3. No open history → fall back to student's monthlyFee, then room price
 */
function resolveAgreedMonthlyPrice(
  student: Student | undefined,
  openHistory: RoomHistoryEntry | undefined,
  rooms: Room[],
): number {
  if (openHistory?.agreedMonthlyPrice !== undefined) {
    return openHistory.agreedMonthlyPrice
  }
  const room = rooms.find((r) => r.id === (openHistory?.roomId ?? student?.roomId))
  return room?.monthlyPrice ?? student?.monthlyFee ?? 0
}

export const useDataStore = create<DataState>((set, get) => ({
  hostels: mockHostels,
  rooms: mockRooms,
  students: mockStudents,
  payments: mockPayments,
  visitors: mockVisitors,
  roomHistory: mockRoomHistory,
  settings: mockSettings,

  addHostel: (h) =>
    set((s) => ({
      hostels: [...s.hostels, { ...h, id: `h-${Date.now()}` }],
    })),

  updateHostel: (id, h) =>
    set((s) => ({
      hostels: s.hostels.map((x) => (x.id === id ? { ...x, ...h } : x)),
    })),

  deleteHostel: (id) =>
    set((s) => ({ hostels: s.hostels.filter((x) => x.id !== id) })),

  addRoom: (r) =>
    set((s) => ({
      rooms: [...s.rooms, { ...r, id: `r-${Date.now()}` }],
    })),

  updateRoom: (id, r) =>
    set((s) => ({
      rooms: s.rooms.map((x) => (x.id === id ? { ...x, ...r } : x)),
    })),

  deleteRoom: (id) =>
    set((s) => ({ rooms: s.rooms.filter((x) => x.id !== id) })),

  addStudent: (stu) => {
    const id = `s-${Date.now()}`
    const month = currentMonthKey()
    set((s) => {
      const newStudents = [...s.students, { ...stu, id }]
      // First assignment should create the current-month accommodation fee.
      // Fee comes from the negotiated agreement if provided (stu.monthlyFee),
      // otherwise the room's default price.
      const feeAmount =
        stu.monthlyFee ?? s.rooms.find((r) => r.id === stu.roomId)?.monthlyPrice ?? 0
      const payments = ensureCurrentMonthFee(s.payments, id, feeAmount, month)
      return { students: newStudents, payments }
    })
    return id
  },

  updateStudent: (id, stu) =>
    set((s) => ({
      students: s.students.map((x) => (x.id === id ? { ...x, ...stu } : x)),
    })),

  deleteStudent: (id) =>
    set((s) => ({ students: s.students.filter((x) => x.id !== id) })),

  changeStudentStatus: (id, status, checkOut) =>
    set((s) => ({
      students: s.students.map((x) => {
        if (x.id !== id) return x
        const updated: Student = {
          ...x,
          status,
          checkOut:
            status === "Left"
              ? (checkOut ?? new Date().toISOString().slice(0, 10))
              : x.checkOut,
        }
        return updated
      }),
      // Close any open room history entry when student leaves
      roomHistory:
        status === "Left"
          ? s.roomHistory.map((h) =>
              h.studentId === id && !h.to
                ? {
                    ...h,
                    to: checkOut ?? new Date().toISOString().slice(0, 10),
                    reason: h.reason ?? "Student left",
                  }
                : h,
            )
          : s.roomHistory,
    })),

  getNextStudentCode: () => {
    const codes = get()
      .students.map((stu) => stu.studentCode)
      .filter((c) => c.startsWith("STU-"))
      .map((c) => parseInt(c.split("-")[1] || "0", 10))
      .filter((n) => !isNaN(n))
    const max = codes.length > 0 ? Math.max(...codes) : 1023
    return `STU-${max + 1}`
  },

  assignStudent: (studentId, hostelId, roomId, bedLabel, agreedMonthlyPrice) =>
    set((s) => {
      const today = new Date().toISOString().slice(0, 10)
      const month = currentMonthKey()
      const updatedHistory = s.roomHistory.map((h) =>
        h.studentId === studentId && !h.to ? { ...h, to: today } : h,
      )
      const updatedStudents = s.students.map((stu) =>
        stu.id === studentId
          ? {
              ...stu,
              hostelId,
              roomId,
              bedLabel,
              status: "Active" as const,
              checkOut: undefined,
              // Mirror the negotiated price onto the student for quick lookups
              ...(agreedMonthlyPrice !== undefined ? { monthlyFee: agreedMonthlyPrice } : {}),
            }
          : stu,
      )
      updatedHistory.push({
        id: `rh-${Date.now()}`,
        studentId,
        hostelId,
        roomId,
        bedLabel,
        from: today,
        reason: updatedHistory.length === 0 ? undefined : "Room change",
        ...(agreedMonthlyPrice !== undefined ? { agreedMonthlyPrice } : {}),
      })
      // Auto-create / refresh current-month accommodation fee using the
      // ASSIGNMENT's agreed price (not the room default).
      const feeAmount =
        agreedMonthlyPrice ?? s.rooms.find((r) => r.id === roomId)?.monthlyPrice ?? 0
      const payments = ensureCurrentMonthFee(s.payments, studentId, feeAmount, month)
      return {
        students: updatedStudents,
        roomHistory: updatedHistory,
        payments,
      }
    }),

  changeStudentRoom: (studentId, hostelId, roomId, bedLabel, agreedMonthlyPrice) =>
    set((s) => {
      const today = new Date().toISOString().slice(0, 10)
      const month = currentMonthKey()
      const updatedHistory = s.roomHistory.map((h) =>
        h.studentId === studentId && !h.to ? { ...h, to: today } : h,
      )
      const updatedStudents = s.students.map((stu) =>
        stu.id === studentId
          ? {
              ...stu,
              hostelId,
              roomId,
              bedLabel,
              ...(agreedMonthlyPrice !== undefined ? { monthlyFee: agreedMonthlyPrice } : {}),
            }
          : stu,
      )
      updatedHistory.push({
        id: `rh-${Date.now()}`,
        studentId,
        hostelId,
        roomId,
        bedLabel,
        from: today,
        reason: "Room change",
        ...(agreedMonthlyPrice !== undefined ? { agreedMonthlyPrice } : {}),
      })
      // Room change: use the NEW assignment's agreed price for the current month.
      // Historical payments stay frozen.
      const feeAmount =
        agreedMonthlyPrice ?? s.rooms.find((r) => r.id === roomId)?.monthlyPrice ?? 0
      const payments = ensureCurrentMonthFee(s.payments, studentId, feeAmount, month)
      return {
        students: updatedStudents,
        roomHistory: updatedHistory,
        payments,
      }
    }),

  getAgreedMonthlyPrice: (studentId) => {
    const s = get()
    const student = s.students.find((x) => x.id === studentId)
    const openHistory = s.roomHistory.find(
      (h) => h.studentId === studentId && !h.to,
    )
    return resolveAgreedMonthlyPrice(student, openHistory, s.rooms)
  },

  getVisitorChargeContext: (visitorId) => {
    const s = get()
    const v = s.visitors.find((x) => x.id === visitorId)
    if (!v) {
      return {
        hostelId: "",
        hostelName: "—",
        roomNumber: "—",
        studentName: "—",
        studentCode: "—",
        kind: "linked" as const,
      }
    }
    const hostel = s.hostels.find((h) => h.id === v.hostelId)
    const room = v.roomId ? s.rooms.find((r) => r.id === v.roomId) : undefined
    const student = v.studentId ? s.students.find((x) => x.id === v.studentId) : undefined
    return {
      hostelId: v.hostelId,
      hostelName: hostel?.name ?? "—",
      roomNumber: room?.number ?? "—",
      studentName: student?.name ?? "—",
      studentCode: student?.studentCode ?? "—",
      kind: v.kind,
    }
  },

  recordPayment: (p) =>
    set((s) => {
      const id = `p-${p.studentId}-${p.month}`
      const existing = s.payments.find(
        (x) => x.studentId === p.studentId && x.month === p.month,
      )
      if (existing) {
        return {
          payments: s.payments.map((x) => (x.id === existing.id ? { ...x, ...p } : x)),
        }
      }
      return {
        payments: [...s.payments, { ...p, id, type: p.type ?? "accommodation" }],
      }
    }),

  /**
   * Record a payment against a student's accommodation fee for a billing month.
   * Updates the running `amount` to be the new total paid and recomputes status.
   * `delta` is the amount being added now; `paidDate` records when it was paid.
   * Enforces: amount must not exceed remaining (total − prior paid).
   */
  recordStudentPayment: ({
    studentId,
    month,
    delta,
    paidDate,
    receiptImage,
  }: {
    studentId: string
    month: string
    delta: number
    paidDate: string
    receiptImage?: string
  }) =>
    set((s) => {
      const id = `p-${studentId}-${month}`
      const existing = s.payments.find(
        (x) => x.studentId === studentId && x.month === month,
      )
      // Use the `paid` field if present; otherwise derive conservatively.
      const priorPaid = existing?.paid ?? 0
      // Resolve the agreed monthly price from the open assignment when no payment exists yet.
      const student = s.students.find((x) => x.id === studentId)
      const openHistory = s.roomHistory.find(
        (h) => h.studentId === studentId && !h.to,
      )
      const agreed = resolveAgreedMonthlyPrice(student, openHistory, s.rooms)
      const total = existing?.amount ?? agreed
      const newPaid = Math.min(total, priorPaid + delta)
      const remaining = Math.max(0, total - newPaid)
      const status: Payment["status"] =
        remaining <= 0 && newPaid > 0
          ? "Paid"
          : newPaid > 0
            ? "Partially Paid"
            : "Pending"
      const next: Payment = {
        id,
        studentId,
        month,
        amount: total, // amount is always the full fee
        paid: newPaid,
        paidDate,
        status,
        type: "accommodation",
        ...(receiptImage !== undefined ? { receiptImage } : {}),
      }
      if (existing) {
        return {
          payments: s.payments.map((x) =>
            x.id === existing.id ? { ...x, ...next } : x,
          ),
        }
      }
      return { payments: [...s.payments, next] }
    }),

  /**
   * Record a payment against a visitor stay.
   * Enforces: payment must not exceed remaining.
   */
  recordVisitorPaymentAmount: ({
    visitorId,
    delta,
    paidDate,
  }: {
    visitorId: string
    delta: number
    paidDate: string
  }) =>
    set((s) => {
      const v = s.visitors.find((x) => x.id === visitorId)
      if (!v) return s
      const priorPaid = v.paid ?? 0
      const newPaid = Math.min(v.total, priorPaid + delta)
      const remaining = Math.max(0, v.total - newPaid)
      const status: Payment["status"] =
        remaining <= 0 && newPaid > 0
          ? "Paid"
          : newPaid > 0
            ? "Partially Paid"
            : "Pending"
      return {
        visitors: s.visitors.map((x) =>
          x.id === visitorId
            ? {
                ...x,
                paid: newPaid,
                paymentStatus: status,
                paidDate,
              }
            : x,
        ),
      }
    }),

  updatePayment: (id, p) =>
    set((s) => ({
      payments: s.payments.map((x) => (x.id === id ? { ...x, ...p } : x)),
    })),

  checkInVisitor: (v) =>
    set((s) => ({
      visitors: [...s.visitors, { ...v, id: `v-${Date.now()}` }],
    })),

  checkOutVisitor: (id) =>
    set((s) => ({
      visitors: s.visitors.map((x) =>
        x.id === id
          ? {
              ...x,
              actualCheckOut: new Date().toISOString(),
              status: "Checked Out",
            }
          : x,
      ),
    })),

  updateVisitor: (id, patch) =>
    set((s) => ({
      visitors: s.visitors.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    })),

  recordVisitorPayment: (id, status) =>
    set((s) => ({
      visitors: s.visitors.map((x) => {
        if (x.id !== id) return x
        // Sync paid to match the new status (rough — caller should use
        // recordVisitorPaymentAmount for actual amount tracking).
        const paid =
          status === "Paid"
            ? x.total
            : status === "Partially Paid"
              ? x.paid ?? Math.round(x.total / 2)
              : 0
        return { ...x, paid, paymentStatus: status }
      }),
    })),

  updateSettings: (st) =>
    set((s) => ({ settings: { ...s.settings, ...st } })),
}))

// ---------- Selectors / derived helpers ----------

export function getStudentsInRoom(students: Student[], roomId: string) {
  return students
    .filter((s) => s.roomId === roomId && s.status === "Active")
    .map((s) => ({ id: s.id, name: s.name }))
}

export function getVacantBedsInRoom(
  students: Student[],
  room: Room,
): string[] {
  const taken = new Set(
    students
      .filter((s) => s.roomId === room.id && s.status === "Active")
      .map((s) => s.bedLabel),
  )
  const beds: string[] = []
  for (let i = 0; i < room.capacity; i++) {
    const label = String.fromCharCode(65 + i) // A, B, C, D, E
    if (!taken.has(label)) beds.push(label)
  }
  return beds
}

export function getOccupancyByHostel(
  hostels: Hostel[],
  rooms: Room[],
  students: Student[],
) {
  return hostels.map((h) => {
    const hostelRooms = rooms.filter((r) => r.hostelId === h.id)
    const totalBeds = hostelRooms.reduce((sum, r) => sum + r.capacity, 0)
    const occupiedBeds = students.filter(
      (s) => s.hostelId === h.id && s.status === "Active",
    ).length
    const vacantRooms = hostelRooms.filter(
      (r) =>
        students.filter(
          (s) => s.roomId === r.id && s.hostelId === h.id && s.status === "Active",
        ).length === 0,
    ).length
    return {
      hostelId: h.id,
      hostelName: h.name,
      totalBeds,
      occupiedBeds,
      vacantBeds: totalBeds - occupiedBeds,
      vacantRooms,
      totalRooms: hostelRooms.length,
    }
  })
}

export function getHostelStats(
  hostel: Hostel,
  rooms: Room[],
  students: Student[],
) {
  const hostelRooms = rooms.filter((r) => r.hostelId === hostel.id)
  const totalRooms = hostelRooms.length
  const totalBeds = hostelRooms.reduce((sum, r) => sum + r.capacity, 0)
  const activeStudentsInHostel = students.filter(
    (s) => s.hostelId === hostel.id && s.status === "Active",
  )
  const occupiedBeds = activeStudentsInHostel.length
  const vacantBeds = totalBeds - occupiedBeds
  const occupiedRoomIds = new Set(activeStudentsInHostel.map((s) => s.roomId))
  const occupiedRooms = occupiedRoomIds.size
  const vacantRooms = totalRooms - occupiedRooms
  const occupancyPercent =
    totalBeds === 0 ? 0 : Math.round((occupiedBeds / totalBeds) * 100)
  return {
    hostel,
    totalRooms,
    occupiedRooms,
    vacantRooms,
    totalBeds,
    occupiedBeds,
    vacantBeds,
    occupancyPercent,
  }
}

export function getRoomStats(
  room: Room,
  students: Student[],
  excludeStudentId?: string,
) {
  const effectiveStudents = excludeStudentId
    ? students.filter((s) => s.id !== excludeStudentId)
    : students
  const roomStudents = effectiveStudents.filter(
    (s) => s.roomId === room.id && s.status === "Active",
  )
  const occupied = roomStudents.length
  const vacant = room.capacity - occupied
  const occupiedBeds = new Set(roomStudents.map((s) => s.bedLabel))
  const vacantBeds: string[] = []
  for (let i = 0; i < room.capacity; i++) {
    const label = String.fromCharCode(65 + i)
    if (!occupiedBeds.has(label)) vacantBeds.push(label)
  }
  let status: "Available" | "Partially Occupied" | "Full"
  if (occupied === 0) status = "Available"
  else if (occupied >= room.capacity) status = "Full"
  else status = "Partially Occupied"
  return {
    room,
    students: roomStudents,
    occupied,
    vacant,
    vacantBeds,
    status,
    occupancyPercent:
      room.capacity === 0 ? 0 : Math.round((occupied / room.capacity) * 100),
  }
}

export function getStudentBed(
  students: Student[],
  roomId: string,
  bedLabel: string,
): Student | undefined {
  return students.find(
    (s) => s.roomId === roomId && s.bedLabel === bedLabel && s.status === "Active",
  )
}
