import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent } from "@/components/ui/card"

export function Visitors() {
  return (
    <>
      <PageHeader
        title="Visitors"
        description="Manage visitor check-ins and hostel guest records."
      />
      <div className="p-4 lg:p-6">
        <Card>
          <CardContent className="p-6 text-sm text-[var(--muted-foreground)]">
            Visitor management UI — coming soon. For now, see the{" "}
            <a
              href="/reports"
              className="font-medium text-[var(--foreground)] underline-offset-4 hover:underline"
            >
              Reports → Visitors
            </a>{" "}
            tab for the visitor log.
          </CardContent>
        </Card>
      </div>
    </>
  )
}
