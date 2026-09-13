import { Outlet } from "react-router-dom"
import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import { useDataStore } from "@/stores/dataStore"

export function AppShell() {
  const settings = useDataStore((s) => s.settings)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--background)]">
      {/* Desktop sidebar */}
      <Sidebar variant="desktop" />

      {/* Mobile drawer sidebar */}
      <Sidebar variant="drawer" />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ systemName: settings.systemName }} />
        </main>
      </div>
    </div>
  )
}
