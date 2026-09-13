import { useEffect, useMemo, useState } from "react"
import { Download, Plus } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { useDataStore } from "@/stores/dataStore"
import { currentMonthKey, formatDate } from "@/lib/utils"
import {
  StudentsToolbar,
  EMPTY_FILTERS,
  type StudentsFilters,
} from "./StudentsToolbar"
import { StudentsDataTable } from "./StudentsDataTable"
import { StudentSheet } from "./StudentSheets"
import { DeleteStudentDialog } from "./DeleteStudentDialog"
import { EmptyState, NoResultsState } from "./EmptyAndNoResults"
import type { Student, StudentStatus } from "@/types"
import type { StudentFormValues } from "@/lib/schemas"

export function StudentsPage() {
  const students = useDataStore((s) => s.students)
  const hostels = useDataStore((s) => s.hostels)
  const rooms = useDataStore((s) => s.rooms)
  const payments = useDataStore((s) => s.payments)
  const addStudent = useDataStore((s) => s.addStudent)
  const updateStudent = useDataStore((s) => s.updateStudent)
  const deleteStudent = useDataStore((s) => s.deleteStudent)
  const changeStudentStatus = useDataStore((s) => s.changeStudentStatus)
  const getNextStudentCode = useDataStore((s) => s.getNextStudentCode)

  const [filters, setFilters] = useState<StudentsFilters>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(false)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState<Student | null>(null)

  const [selected, setSelected] = useState<Set<string>>(new Set())

  const currentMonth = currentMonthKey()

  const availableMonths = useMemo(() => {
    const set = new Set<string>()
    for (const p of payments) set.add(p.month)
    return Array.from(set).sort().reverse()
  }, [payments])

  useEffect(() => {
    setIsLoading(true)
    const t = setTimeout(() => setIsLoading(false), 220)
    return () => clearTimeout(t)
  }, [filters, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [filters])

  // Reset selection when filters/page change so the bulk-action button stays accurate
  useEffect(() => {
    setSelected(new Set())
  }, [filters, page])

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return students.filter((s) => {
      if (search) {
        const hay = [
          s.name,
          s.studentCode,
          s.phone,
          s.bio,
          s.address,
          s.referencePerson,
          rooms.find((r) => r.id === s.roomId)?.number ?? "",
          hostels.find((h) => h.id === s.hostelId)?.name ?? "",
        ]
          .join(" ")
          .toLowerCase()
        if (!hay.includes(search)) return false
      }
      if (filters.status !== "all" && s.status !== filters.status) return false
      if (filters.hostelId !== "all" && s.hostelId !== filters.hostelId)
        return false
      if (filters.roomId !== "all" && s.roomId !== filters.roomId)
        return false
      if (filters.checkInFrom && s.checkIn < filters.checkInFrom) return false

      // Financial filters (require a current-month accommodation payment record)
      const targetMonth = filters.month !== "all" ? filters.month : currentMonth
      const payment = payments.find(
        (p) =>
          p.studentId === s.id &&
          p.month === targetMonth &&
          (p.type ?? "accommodation") === "accommodation",
      )
      if (filters.paymentStatus !== "all") {
        if (!payment || payment.status !== filters.paymentStatus) return false
      }
      if (filters.balance === "outstanding") {
        if (!payment || payment.status === "Paid") return false
      }
      if (filters.balance === "paid") {
        if (!payment || payment.status !== "Paid") return false
      }
      return true
    })
  }, [students, filters, hostels, rooms, payments, currentMonth])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const handleAddClick = () => {
    setEditing(null)
    setSheetOpen(true)
  }

  const handleEdit = (student: Student) => {
    setEditing(student)
    setSheetOpen(true)
  }

  const handleChangeStatus = (student: Student, status: StudentStatus) => {
    changeStudentStatus(student.id, status)
    toast.success(`${student.name} marked as ${status}`)
  }

  const handleDelete = (student: Student) => {
    setDeleting(student)
    setDeleteOpen(true)
  }

  const handleSubmit = (values: StudentFormValues) => {
    if (editing) {
      updateStudent(editing.id, values)
      toast.success(`${values.name} updated`)
    } else {
      addStudent({
        ...values,
        studentCode: values.studentCode || getNextStudentCode(),
      } as Omit<Student, "id">)
      toast.success(`${values.name} added`)
    }
    setSheetOpen(false)
  }

  const handleConfirmDelete = (student: Student) => {
    deleteStudent(student.id)
    setDeleteOpen(false)
    toast.success(`${student.name} deleted`)
  }

  const selectedStudents = useMemo(
    () => students.filter((s) => selected.has(s.id)),
    [students, selected],
  )

  const handleExportSelected = () => {
    if (selectedStudents.length === 0) return
    exportStudentsToCSV(selectedStudents, hostels, rooms, payments, currentMonth)
    toast.success(
      `Exported ${selectedStudents.length} nomad${selectedStudents.length === 1 ? "" : "s"}`,
    )
    setSelected(new Set())
  }

  const hasStudents = students.length > 0
  const hasResults = filtered.length > 0
  const hasSelection = selected.size > 0

  return (
    <>
      <PageHeader
        title="Nomads"
        description="Manage hostel students, accommodation, status and payments."
        actions={
          <>
            {hasSelection && (
              <Button variant="outline" size="sm" onClick={handleExportSelected}>
                <Download className="h-3.5 w-3.5" />
                Export {selected.size}
              </Button>
            )}
            <Button onClick={handleAddClick}>
              <Plus className="h-3.5 w-3.5" />
              Add Student
            </Button>
          </>
        }
      />

      <div className="space-y-4 p-4 lg:p-6">
        <StudentsToolbar
          filters={filters}
          onChange={setFilters}
          hostels={hostels}
          rooms={rooms}
          months={availableMonths}
          onClear={() => setFilters(EMPTY_FILTERS)}
        />

        {!hasStudents ? (
          <EmptyState onAdd={handleAddClick} />
        ) : !hasResults ? (
          <NoResultsState onClear={() => setFilters(EMPTY_FILTERS)} />
        ) : (
          <StudentsDataTable
            students={paged}
            hostels={hostels}
            rooms={rooms}
            payments={payments}
            currentMonth={currentMonth}
            isLoading={isLoading}
            page={page}
            pageSize={pageSize}
            totalItems={filtered.length}
            selected={selected}
            onSelectionChange={setSelected}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s)
              setPage(1)
            }}
            onEdit={handleEdit}
            onChangeStatus={handleChangeStatus}
            onDelete={handleDelete}
          />
        )}
      </div>

      <StudentSheet
        mode={editing ? "edit" : "add"}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        student={editing}
        hostels={hostels}
        rooms={rooms}
        students={students}
        onSubmit={handleSubmit}
      />

      <DeleteStudentDialog
        student={deleting}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}

/**
 * Trigger a CSV download for the given students.
 * Includes core profile, location and current-month fee context.
 */
function exportStudentsToCSV(
  students: Student[],
  hostels: Hostel[],
  rooms: Room[],
  payments: import("@/types").Payment[],
  currentMonth: string,
) {
  const hostelById = new Map(hostels.map((h) => [h.id, h]))
  const roomById = new Map(rooms.map((r) => [r.id, r]))
  const headers = [
    "Nomad ID",
    "Name",
    "Phone",
    "Email",
    "CNIC",
    "Status",
    "Hostel",
    "Room",
    "Bed",
    "From (city)",
    "Check-in",
    "Reference Person",
    "Fee (current month)",
    "Fee Status",
  ]
  const escape = (v: string | number | null | undefined) => {
    if (v === null || v === undefined) return ""
    const s = String(v)
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const rows = students.map((s) => {
    const payment = payments.find(
      (p) =>
        p.studentId === s.id &&
        p.month === currentMonth &&
        (p.type ?? "accommodation") === "accommodation",
    )
    return [
      s.studentCode,
      s.name,
      s.phone,
      s.email,
      s.cnic,
      s.status,
      hostelById.get(s.hostelId)?.name ?? "",
      roomById.get(s.roomId)?.number ?? "",
      s.bedLabel,
      s.bio,
      formatDate(s.checkIn),
      s.referencePerson,
      payment ? payment.amount : "",
      payment ? payment.status : "",
    ]
  })
  const csv = [headers, ...rows]
    .map((r) => r.map(escape).join(","))
    .join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `nomads-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
