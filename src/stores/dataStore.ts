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
  assignStudent: (studentId: string, hostelId: string, roomId: string, bedLabel: string) => void
  changeStudentRoom: (studentId: string, hostelId: string, roomId: string, bedLabel: string) => void
  getNextStudentCode: () => string

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
  if (existing) return payments
  return [
    ...payments,
    {
      id,
      studentId,
      month,
      amount,
      status: "Pending",
      type: "accommodation" as PaymentType,
    },
  ]
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
      // First assignment should create the current-month accommodation fee
      // priced from the room's monthlyPrice (room overrides apply).
      const feeAmount = stu.monthlyFee ?? s.rooms.find((r) => r.id === stu.roomId)?.monthlyPrice ?? 0
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

  assignStudent: (studentId, hostelId, roomId, bedLabel) =>
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
      })
      // Auto-create / refresh current-month accommodation fee from room price
      const stu = updatedStudents.find((x) => x.id === studentId)
      const feeAmount =
        stu?.monthlyFee ?? s.rooms.find((r) => r.id === roomId)?.monthlyPrice ?? 0
      const payments = ensureCurrentMonthFee(s.payments, studentId, feeAmount, month)
      return {
        students: updatedStudents,
        roomHistory: updatedHistory,
        payments,
      }
    }),

  changeStudentRoom: (studentId, hostelId, roomId, bedLabel) =>
    set((s) => {
      const today = new Date().toISOString().slice(0, 10)
      const month = currentMonthKey()
      const updatedHistory = s.roomHistory.map((h) =>
        h.studentId === studentId && !h.to ? { ...h, to: today } : h,
      )
      const updatedStudents = s.students.map((stu) =>
        stu.id === studentId ? { ...stu, hostelId, roomId, bedLabel } : stu,
      )
      updatedHistory.push({
        id: `rh-${Date.now()}`,
        studentId,
        hostelId,
        roomId,
        bedLabel,
        from: today,
        reason: "Room change",
      })
      // Room change: use NEW room's price for the current month only.
      // Historical payments stay frozen.
      const stu = updatedStudents.find((x) => x.id === studentId)
      const feeAmount =
        stu?.monthlyFee ?? s.rooms.find((r) => r.id === roomId)?.monthlyPrice ?? 0
      const payments = ensureCurrentMonthFee(s.payments, studentId, feeAmount, month)
      return {
        students: updatedStudents,
        roomHistory: updatedHistory,
        payments,
      }
    }),

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
      const priorAmountPaid = existing?.status === "Paid"
        ? existing.amount
        : existing?.status === "Partially Paid"
          ? Math.round((existing.amount ?? 0) / 2)
          : 0
      const total = existing?.amount ?? s.students.find((x) => x.id === studentId)?.monthlyFee ?? s.rooms.find((r) => r.id === s.students.find((x) => x.id === studentId)?.roomId)?.monthlyPrice ?? 0
      const newPaid = priorAmountPaid + delta
      const remaining = Math.max(0, total - newPaid)
      const status: Payment["status"] =
        remaining <= 0 ? "Paid" : newPaid > 0 ? "Partially Paid" : "Pending"
      const next: Payment = {
        id,
        studentId,
        month,
        amount: newPaid, // amount in store = total paid (used for "already paid")
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
      const priorPaid =
        v.paymentStatus === "Paid"
          ? v.total
          : v.paymentStatus === "Partially Paid"
            ? Math.round(v.total / 2)
            : 0
      const newPaid = priorPaid + delta
      const remaining = Math.max(0, v.total - newPaid)
      const status: Payment["status"] =
        remaining <= 0 ? "Paid" : newPaid > 0 ? "Partially Paid" : "Pending"
      return {
        visitors: s.visitors.map((x) =>
          x.id === visitorId
            ? {
                ...x,
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
      visitors: s.visitors.map((x) =>
        x.id === id ? { ...x, paymentStatus: status } : x,
      ),
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
