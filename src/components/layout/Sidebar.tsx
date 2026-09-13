import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Settings as SettingsIcon,
  X,
  Wallet,
  UserCheck,
} from "lucide-react"
import { useUIStore } from "@/stores/uiStore"
import { cn } from "@/lib/utils"

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/students", label: "Students", icon: Users, end: false },
  { to: "/hostels", label: "Hostels", icon: Building2, end: false },
  { to: "/visitors", label: "Visitors", icon: UserCheck, end: false },
  { to: "/finance", label: "Finance", icon: Wallet, end: false },
  { to: "/reports", label: "Reports", icon: FileText, end: false },
  { to: "/settings", label: "Settings", icon: SettingsIcon, end: false },
]

interface SidebarProps {
  variant?: "desktop" | "drawer"
}

export function Sidebar({ variant = "desktop" }: SidebarProps) {
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  const isDrawer = variant === "drawer"

  return (
    <>
      {/* Mobile backdrop */}
      {isDrawer && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "flex h-full w-64 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] text-[var(--sidebar-foreground)]",
          isDrawer
            ? cn(
                "fixed inset-y-0 left-0 z-50 transition-transform duration-200",
                sidebarOpen ? "translate-x-0" : "-translate-x-full",
                "lg:hidden",
              )
            : "hidden lg:flex",
        )}
      >
        <div className="flex h-14 items-center justify-between px-4 border-b border-[var(--sidebar-border)]">
          <div className="flex items-center gap-2.5">
            <img
              src="/nomads-logo.svg"
              alt="Nomads Boys Hostel logo"
              className="h-8 w-8 shrink-0"
            />
            <span className="font-display text-[12px] font-semibold leading-tight tracking-tight">
              NOMADS
              <br />
              BOYS HOSTEL
            </span>
          </div>
          {isDrawer && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-1.5 hover:bg-[var(--sidebar-accent)]"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => isDrawer && setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)]"
                    : "text-[var(--sidebar-foreground)]/80 hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[var(--sidebar-border)] p-4 text-xs text-[var(--muted-foreground)]">
          <p className="font-medium text-[var(--sidebar-foreground)]">v1.0</p>
          <p>Nomads Boys Hostel</p>
        </div>
      </aside>
    </>
  )
}
