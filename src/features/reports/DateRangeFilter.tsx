import { useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface DateRange {
  from?: Date
  to?: Date
}

interface DateRangeFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
  placeholder?: string
}

export function DateRangeFilter({
  value,
  onChange,
  className,
  placeholder = "Pick date range",
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false)

  const label =
    value.from && value.to
      ? `${format(value.from, "dd MMM")} – ${format(value.to, "dd MMM yyyy")}`
      : value.from
        ? format(value.from, "dd MMM yyyy")
        : placeholder

  const presets: { label: string; range: DateRange }[] = [
    {
      label: "This month",
      range: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(),
      },
    },
    {
      label: "Last month",
      range: {
        from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        to: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
      },
    },
    {
      label: "Last 3 months",
      range: {
        from: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1),
        to: new Date(),
      },
    },
    {
      label: "Last 6 months",
      range: {
        from: new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1),
        to: new Date(),
      },
    },
  ]

  const hasValue = !!value.from || !!value.to

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 justify-start gap-2 px-3 text-left font-normal",
            !hasValue && "text-[var(--muted-foreground)]",
            className,
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          <span className="truncate">{label}</span>
          {hasValue && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange({})
              }}
              className="ml-1 rounded p-0.5 hover:bg-[var(--accent)]"
              aria-label="Clear date range"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0" alignOffset={-4}>
        <div className="flex">
          <div className="flex flex-col gap-1 border-r border-[var(--border)] p-3">
            {presets.map((p) => (
              <Button
                key={p.label}
                variant="ghost"
                size="sm"
                className="justify-start font-normal"
                onClick={() => {
                  onChange(p.range)
                  setOpen(false)
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <Calendar
            mode="range"
            selected={{ from: value.from, to: value.to }}
            onSelect={(range) => {
              onChange({ from: range?.from, to: range?.to })
              if (range?.from && range?.to) setOpen(false)
            }}
            numberOfMonths={2}
            autoFocus
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
