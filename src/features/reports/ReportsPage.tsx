import { useRef, useState } from "react"
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { OverviewReport } from "./OverviewReport"
import { OccupancyReport } from "./OccupancyReport"
import { StudentsReport } from "./StudentsReport"
import { VisitorsReport } from "./VisitorsReport"
import { FinancialReport } from "./FinancialReport"
import { exportToExcel, exportToPDF, type ExportColumn } from "./export"

type ReportTab = "overview" | "occupancy" | "students" | "visitors" | "financial"

interface ExportPayload<T = unknown> {
  rows: T[]
  columns: ExportColumn<T>[]
  sheetTitle: string
}

export function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>("overview")
  const exportPayload = useRef<ExportPayload | null>(null)

  const handleExportReady = <T,>(payload: ExportPayload<T>) => {
    exportPayload.current = payload as ExportPayload
  }

  const handleExport = async (format: "excel" | "pdf") => {
    const payload = exportPayload.current
    if (!payload) {
      toast.error("Nothing to export", {
        description: "This report does not support export.",
      })
      return
    }
    const filename = `${payload.sheetTitle.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}`
    try {
      if (format === "excel") {
        await exportToExcel({
          filename,
          sheetTitle: payload.sheetTitle,
          columns: payload.columns,
          rows: payload.rows,
        })
        toast.success("Excel exported", { description: filename + ".xlsx" })
      } else {
        await exportToPDF({
          filename,
          sheetTitle: payload.sheetTitle,
          columns: payload.columns,
          rows: payload.rows,
        })
        toast.success("PDF exported", { description: filename + ".pdf" })
      }
    } catch (e) {
      toast.error("Export failed", { description: String(e) })
    }
  }

  return (
    <>
      <PageHeader
        title="Reports"
        description="View operational, occupancy, visitor and financial reports."
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-3.5 w-3.5" />
                Export
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wider">
                Export current report
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => handleExport("excel")}>
                <FileSpreadsheet className="text-[var(--muted-foreground)]" />
                Export Excel
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleExport("pdf")}>
                <FileText className="text-[var(--muted-foreground)]" />
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <div className="space-y-4 p-4 lg:p-6">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as ReportTab)}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="visitors">Visitors</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <OverviewReport />
          </TabsContent>

          <TabsContent value="occupancy" className="space-y-4">
            <OccupancyReport onExportReady={handleExportReady} />
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <StudentsReport onExportReady={handleExportReady} />
          </TabsContent>

          <TabsContent value="visitors" className="space-y-4">
            <VisitorsReport onExportReady={handleExportReady} />
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <FinancialReport onExportReady={handleExportReady} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
