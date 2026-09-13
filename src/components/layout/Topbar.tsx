import { Menu, Search, Bell } from "lucide-react"
import { useUIStore } from "@/stores/uiStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TopbarProps {
  title?: string
  subtitle?: string
  children?: React.ReactNode
}

export function Topbar({ title, subtitle, children }: TopbarProps) {
  const { toggleSidebar } = useUIStore()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[var(--background)]/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/80 lg:px-6">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Open menu</TooltipContent>
      </Tooltip>

      {(title || subtitle) && (
        <div className="hidden flex-col sm:flex">
          {title && (
            <h1 className="font-display text-base font-semibold leading-tight">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-xs text-[var(--muted-foreground)]">{subtitle}</p>
          )}
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        {children}
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            placeholder="Search…"
            className="h-8 w-56 pl-8 text-xs"
            aria-label="Search"
          />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>
      </div>
    </header>
  )
}
