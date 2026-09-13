import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent } from "@/components/ui/card"

export function Students() {
  return (
    <>
      <PageHeader
        title="Students"
        description="Manage student records, profiles, fees and history."
      />
      <div className="p-4 lg:p-6">
        <Card>
          <CardContent className="p-6 text-sm text-[var(--muted-foreground)]">
            Student list module — coming in Phase 5.
          </CardContent>
        </Card>
      </div>
    </>
  )
}
