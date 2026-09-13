import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent } from "@/components/ui/card"

export function Hostels() {
  return (
    <>
      <PageHeader
        title="Hostels & Visitors"
        description="Manage hostels, rooms, beds and visitor check-ins."
      />
      <div className="p-4 lg:p-6">
        <Card>
          <CardContent className="p-6 text-sm text-[var(--muted-foreground)]">
            Hostels & Visitors module — coming in Phase 6 & 7.
          </CardContent>
        </Card>
      </div>
    </>
  )
}
