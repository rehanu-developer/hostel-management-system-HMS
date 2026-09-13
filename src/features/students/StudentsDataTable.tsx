import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Wallet,
  Trash2,
  Check,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  studentStatusLabel,
  studentStatusVariant,
  paymentStatusVariant,
} from "./studentStatus"
import { formatDate } from "@/lib/utils"
import type {
  Student,
  Hostel,
  Room,
  Payment,
  PaymentStatus,
  StudentStatus,
} from "@/types"

interface StudentsDataTableProps {
  students: Student[]
  hostels: Hostel[]
  rooms: Room[]
  payments: Payment[]
  currentMonth: string
  isLoading: boolean
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onEdit: (student: Student) => void
  onChangeStatus: (student: Student, status: StudentStatus) => void
  onDelete: (student: Student) => void
}

export function StudentsDataTable({
  students,
  hostels,
  rooms,
  payments,
  currentMonth,
  isLoading,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onChangeStatus,
  onDelete,
}: StudentsDataTableProps) {
  const navigate = useNavigate()
  const hostelById = new Map(hostels.map((h) => [h.id, h]))
  const roomById = new Map(rooms.map((r) => [r.id, r]))

  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Clear selection when the underlying list (page/filters) changes
  useEffect(() => {
    setSelected(new Set())
  }, [students])

  const allOnPageSelected =
    students.length > 0 && students.every((s) => selected.has(s.id))
  const someOnPageSelected =
    students.some((s) => selected.has(s.id)) && !allOnPageSelected

  const toggleAll = () => {
    if (allOnPageSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(students.map((s) => s.id)))
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  if (isLoading) {
    return (
      <TableContainer>
        <TableSkeleton />
        <Pagination
          page={page}
          totalPages={totalPages}
          from={from}
          to={to}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </TableContainer>
    )
  }

  return (
    <TableContainer
      footer={
        <Pagination
          page={page}
          totalPages={totalPages}
          from={from}
          to={to}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      }
    >
      <Table className="table-fixed">
        <colgroup>
          <col className="w-[44px]" />
          <col className="w-[200px]" />
          <col />
          <col className="w-[110px]" />
          <col className="w-[140px]" />
          <col className="w-[130px]" />
          <col className="w-[140px]" />
          <col className="w-[120px]" />
          <col className="w-[72px]" />
        </colgroup>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-6">
              <Checkbox
                checked={
                  allOnPageSelected
                    ? true
                    : someOnPageSelected
                      ? "indeterminate"
                      : false
                }
                onCheckedChange={toggleAll}
                aria-label="Select all rows on this page"
              />
            </TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Hostel</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Fee</TableHead>
            <TableHead>Check-in</TableHead>
            <TableHead className="pr-6 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => {
            const hostel = hostelById.get(student.hostelId)
            const room = roomById.get(student.roomId)
            const payment = payments.find(
              (p) => p.studentId === student.id && p.month === currentMonth,
            )
            const isSelected = selected.has(student.id)
            return (
              <TableRow
                key={student.id}
                data-state={isSelected ? "selected" : undefined}
                className="group"
              >
                <TableCell className="pl-6" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleOne(student.id)}
                    aria-label={`Select ${student.name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-[14px] text-[var(--foreground)]">
                      {student.name}
                    </span>
                    <span className="text-[12px] text-[var(--muted-foreground)]">
                      {student.studentCode}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-[14px] text-[var(--muted-foreground)]">
                  <span className="line-clamp-1">{hostel?.name ?? "—"}</span>
                </TableCell>
                <TableCell>
                  {room ? (
                    <span className="whitespace-nowrap text-[14px] text-[var(--foreground)]">
                      Room {room.number}
                    </span>
                  ) : (
                    <span className="text-[14px] text-[var(--muted-foreground)]">
                      Unassigned
                    </span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-[14px] text-[var(--muted-foreground)] tabular-nums">
                  {student.phone}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <StatusDropdown
                    student={student}
                    onChangeStatus={(s) =>
                      onChangeStatus(student, s as StudentStatus)
                    }
                  />
                </TableCell>
                <TableCell>
                  {payment ? (
                    <Badge variant={paymentStatusVariant[payment.status as PaymentStatus]} className="whitespace-nowrap">
                      {payment.status}
                    </Badge>
                  ) : (
                    <span className="text-[14px] text-[var(--muted-foreground)]">
                      No record
                    </span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-[14px] text-[var(--muted-foreground)] tabular-nums">
                  {formatDate(student.checkIn)}
                </TableCell>
                <TableCell
                  className="pr-6 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <RowActionsMenu
                    student={student}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function TableContainer({
  children,
  footer,
}: {
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <div>{children}</div>
      {footer && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-[var(--border)] px-6 py-4 sm:flex-row">
          {footer}
        </div>
      )}
    </div>
  )
}

function StatusDropdown({
  student,
  onChangeStatus,
}: {
  student: Student
  onChangeStatus: (s: StudentStatus) => void
}) {
  const current = student.status as StudentStatus
  const options: StudentStatus[] = ["Active", "Suspended", "Left"]
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Change status for ${student.name}`}
              className="inline-flex items-center gap-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <Badge variant={studentStatusVariant[current]} className="whitespace-nowrap">
                {studentStatusLabel[current]}
              </Badge>
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Change status</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wider">
          Set status
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((s) => (
          <DropdownMenuItem
            key={s}
            onSelect={(e) => {
              e.preventDefault()
              if (s !== current) onChangeStatus(s)
            }}
            disabled={s === current}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                s === current
                  ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)]"
              }`}
            >
              {s === current ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
              )}
            </span>
            {studentStatusLabel[s]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RowActionsMenu({
  student,
  onEdit,
  onDelete,
}: {
  student: Student
  onEdit: (s: Student) => void
  onDelete: (s: Student) => void
}) {
  const navigate = useNavigate()

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] sm:h-8 sm:w-8"
              aria-label={`Actions for ${student.name}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Row actions</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wider">
          Actions
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            navigate(`/students/${student.id}`)
          }}
        >
          <IconBubble>
            <Eye className="h-3.5 w-3.5" />
          </IconBubble>
          View profile
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            onEdit(student)
          }}
        >
          <IconBubble>
            <Pencil className="h-3.5 w-3.5" />
          </IconBubble>
          Edit student
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            navigate(`/students/${student.id}#payments`)
          }}
        >
          <IconBubble>
            <Wallet className="h-3.5 w-3.5" />
          </IconBubble>
          View payments
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            onDelete(student)
          }}
          className="text-[var(--destructive-soft-foreground)] focus:bg-[var(--destructive-soft)] focus:text-[var(--destructive-soft-foreground)]"
        >
          <IconBubble variant="danger">
            <Trash2 className="h-3.5 w-3.5" />
          </IconBubble>
          Delete student
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function IconBubble({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode
  variant?: "neutral" | "danger"
}) {
  const tone =
    variant === "danger"
      ? "bg-[var(--destructive-soft)] text-[var(--destructive-soft-foreground)]"
      : "bg-[var(--muted)] text-[var(--muted-foreground)]"
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${tone}`}
    >
      {children}
    </span>
  )
}

function Pagination({
  page,
  totalPages,
  from,
  to,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  page: number
  totalPages: number
  from: number
  to: number
  totalItems: number
  pageSize: number
  onPageChange: (p: number) => void
  onPageSizeChange: (s: number) => void
}) {
  return (
    <>
      <p className="text-[13px] text-[var(--muted-foreground)]">
        Showing{" "}
        <span className="font-medium text-[var(--foreground)] tabular-nums">
          {from}
        </span>
        –
        <span className="font-medium text-[var(--foreground)] tabular-nums">
          {to}
        </span>{" "}
        of{" "}
        <span className="font-medium text-[var(--foreground)] tabular-nums">
          {totalItems}
        </span>{" "}
        students
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-[var(--muted-foreground)]">
            Rows per page
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger className="h-8 w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </>
  )
}

function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[44px] pl-6">
            <Skeleton className="h-4 w-4 rounded-sm" />
          </TableHead>
          <TableHead>Student</TableHead>
          <TableHead>Hostel</TableHead>
          <TableHead>Room</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Fee</TableHead>
          <TableHead>Check-in</TableHead>
          <TableHead className="pr-6 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }).map((_, i) => (
          <TableRow key={i} className="hover:bg-transparent">
            <TableCell className="pl-6">
              <Skeleton className="h-4 w-4 rounded-sm" />
            </TableCell>
            <TableCell>
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-16 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-20 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell className="pr-6 text-right">
              <Skeleton className="ml-auto h-8 w-8 rounded-full" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// Pagination props are passed in via parent — no separate props type needed
