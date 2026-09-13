import { MoreHorizontal, Pencil, Trash2, UserCog, Eye } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface StudentRowActionsMenuProps {
  studentId: string
  studentName: string
  onEdit: () => void
  onChangeStatus: () => void
  onDelete: () => void
}

export function StudentRowActionsMenu({
  studentId,
  studentName,
  onEdit,
  onChangeStatus,
  onDelete,
}: StudentRowActionsMenuProps) {
  const navigate = useNavigate()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label={`Actions for ${studentName}`}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            navigate(`/students/${studentId}`)
          }}
        >
          <Eye className="text-[var(--muted-foreground)]" />
          View Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            onEdit()
          }}
        >
          <Pencil className="text-[var(--muted-foreground)]" />
          Edit Student
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            onChangeStatus()
          }}
        >
          <UserCog className="text-[var(--muted-foreground)]" />
          Change Status
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            onDelete()
          }}
          className="text-[var(--destructive)] focus:bg-[var(--destructive)]/10 focus:text-[var(--destructive)]"
        >
          <Trash2 />
          Delete Student
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
