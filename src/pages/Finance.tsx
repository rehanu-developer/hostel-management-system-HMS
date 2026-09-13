import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent } from "@/components/ui/card"

export function Finance() {
  return (
    <>
      <PageHeader
        title="Finance"
        description="Track payments, outstanding fees and financial summaries."
      />
      <div className="p-4 lg:p-6">
        <Card>
          <CardContent className="p-6 text-sm text-[var(--muted-foreground)]">
            Finance management — coming soon. For now, see the{" "}
            <a
              href="/reports"
              className="font-medium text-[var(--foreground)] underline-offset-4 hover:underline"
            >
              Reports → Financial
            </a>{" "}
            tab for the current financial overview.
          </CardContent>
        </Card>
      </div>
    </>
  )
}
