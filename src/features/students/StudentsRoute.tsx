import { useParams } from "react-router-dom"
import { useState } from "react"
import { toast } from "sonner"
import { StudentsPage } from "./StudentsPage"
import { StudentProfile } from "./StudentProfile"
import { StudentSheet } from "./StudentSheets"
import { useDataStore } from "@/stores/dataStore"
import type { Student } from "@/types"
import type { StudentFormValues } from "@/lib/schemas"

export function StudentsRoute() {
  const { id } = useParams<{ id: string }>()
  const students = useDataStore((s) => s.students)
  const hostels = useDataStore((s) => s.hostels)
  const rooms = useDataStore((s) => s.rooms)
  const updateStudent = useDataStore((s) => s.updateStudent)

  const [editingFromProfile, setEditingFromProfile] = useState(false)
  const editingStudent =
    editingFromProfile && id ? students.find((s) => s.id === id) ?? null : null

  if (id) {
    return (
      <>
        <StudentProfile onEdit={() => setEditingFromProfile(true)} />
        <StudentSheet
          mode="edit"
          open={editingFromProfile}
          onOpenChange={setEditingFromProfile}
          student={editingStudent}
          hostels={hostels}
          rooms={rooms}
          students={students}
          onSubmit={(values: StudentFormValues) => {
            if (editingStudent) {
              updateStudent(editingStudent.id, values)
              toast.success(`${values.name} updated`)
              setEditingFromProfile(false)
            }
          }}
        />
      </>
    )
  }

  return <StudentsPage />
}
