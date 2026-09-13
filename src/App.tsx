import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppShell } from "@/layouts/AppShell"
import { Dashboard } from "@/pages/Dashboard"
import { StudentsRoute } from "@/features/students/StudentsRoute"
import { HostelsPage } from "@/features/hostels/HostelsPage"
import { HostelDetailPage } from "@/features/hostels/HostelDetailPage"
import { Visitors } from "@/features/visitors/VisitorsPage"
import { Finance } from "@/pages/Finance"
import { ReportsPage } from "@/features/reports/ReportsPage"
import { SettingsPage } from "@/features/settings/SettingsPage"

function App() {
  return (
    <TooltipProvider delayDuration={300}>
      <BrowserRouter>
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "border border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)]",
            },
          }}
        />
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="students" element={<StudentsRoute />} />
            <Route path="students/:id" element={<StudentsRoute />} />
            <Route path="hostels" element={<HostelsPage />} />
            <Route path="hostels/:id" element={<HostelDetailPage />} />
            <Route path="visitors" element={<Visitors />} />
            <Route path="finance" element={<Finance />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  )
}

export default App
