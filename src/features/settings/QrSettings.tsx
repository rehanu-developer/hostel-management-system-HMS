import { useMemo, useState } from "react"
import { Check, Copy, QrCode } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Bank = "easypaisa" | "hbl" | "jazzcash"

interface BankInfo {
  id: Bank
  label: string
  accountTitle: string
  accountNumber: string
}

const BANKS: BankInfo[] = [
  {
    id: "easypaisa",
    label: "Easypaisa",
    accountTitle: "Nomads Boys Hostel",
    accountNumber: "0300-1234567",
  },
  {
    id: "hbl",
    label: "HBL",
    accountTitle: "Nomads Boys Hostel",
    accountNumber: "1234-5678-9012-3456",
  },
  {
    id: "jazzcash",
    label: "JazzCash",
    accountTitle: "Nomads Boys Hostel",
    accountNumber: "0301-7654321",
  },
]

export function QrSettings() {
  const [bank, setBank] = useState<Bank>("easypaisa")
  const [copied, setCopied] = useState(false)

  const current = BANKS.find((b) => b.id === bank)!
  const qrUrl = useMemo(
    () =>
      `https://pay.nomadsboyshostel.pk/${bank}/${encodeURIComponent(current.accountNumber)}`,
    [bank, current.accountNumber],
  )

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl)
      setCopied(true)
      toast.success("URL copied to clipboard")
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Could not copy to clipboard")
    }
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        {/* Heading */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-[var(--muted-foreground)]" />
            <h3 className="font-display text-base font-semibold tracking-tight">
              Payment QR
            </h3>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Display the right QR to incoming guests so they can scan and pay
            via their preferred bank. Dummy data — replace with live merchant
            details before going to production.
          </p>
        </div>

        {/* Pill tabs */}
        <div className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--muted)]/40 p-1">
          {BANKS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBank(b.id)}
              aria-pressed={bank === b.id}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                bank === b.id
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
              )}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* QR + details */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* QR code */}
          <div className="shrink-0 rounded-lg border border-[var(--border)] bg-white p-4">
            <DummyQr seed={bank} />
            <p className="mt-2 text-center text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
              Scan to pay
            </p>
          </div>

          {/* Details + copy URL */}
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                {current.label}
              </p>
              <p className="mt-1 font-display text-base font-semibold">
                {current.accountTitle}
              </p>
              <p className="mt-0.5 font-mono text-sm tabular-nums">
                {current.accountNumber}
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                Payment URL
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <code className="flex-1 truncate rounded-md border border-[var(--border)] bg-[var(--muted)]/30 px-3 py-2 text-xs text-[var(--muted-foreground)]">
                  {qrUrl}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0 gap-1.5"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied" : "Copy URL"}
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-[var(--muted-foreground)]">
              Paste this URL in invoices, receipts, or share with guests
              directly.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Hand-rolled deterministic dummy QR-style SVG.
 * Renders the three signature finder patterns (top-left, top-right,
 * bottom-left) plus a stable pseudo-random data fill seeded by the
 * selected bank so each tab gets a visually distinct code.
 */
function DummyQr({ seed }: { seed: string }) {
  const SIZE = 25 // 25x25 module grid
  const cell = 8 // px per module
  const total = SIZE * cell

  // Deterministic 32-bit hash of (seed + coord)
  const hash = (x: number, y: number) => {
    const s = `${seed}:${x},${y}`
    let h = 2166136261
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    return h >>> 0
  }

  // Returns true if cell (x,y) is "dark"
  const isDark = (x: number, y: number) => (hash(x, y) & 1) === 0

  // 7x7 finder pattern at (cx, cy) — outer black, white ring, black core
  const isFinder = (x: number, y: number) => {
    const inFinder = (cx: number, cy: number) =>
      x >= cx && x < cx + 7 && y >= cy && y < cy + 7
    if (!inFinder(0, 0) && !inFinder(SIZE - 7, 0) && !inFinder(0, SIZE - 7)) {
      return null
    }
    const cx = inFinder(0, 0) ? 0 : inFinder(SIZE - 7, 0) ? SIZE - 7 : 0
    const cy = inFinder(0, 0) ? 0 : inFinder(SIZE - 7, 0) ? 0 : SIZE - 7
    const lx = x - cx
    const ly = y - cy
    // Outer 7x7 black, inner 5x5 white, inner 3x3 black
    const onBorder = lx === 0 || lx === 6 || ly === 0 || ly === 6
    const onCore = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4
    return onBorder || onCore
  }

  // Build path data for all dark cells (grouped into one path for perf)
  let path = ""
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const fromFinder = isFinder(x, y)
      const dark = fromFinder !== null ? fromFinder : isDark(x, y)
      if (dark) {
        path += `M${x * cell} ${y * cell}h${cell}v${cell}h${cell - cell}z `
      }
    }
  }

  return (
    <svg
      width={total}
      height={total}
      viewBox={`0 0 ${total} ${total}`}
      role="img"
      aria-label="Dummy payment QR code"
      className="block"
    >
      <rect width={total} height={total} fill="#ffffff" />
      <path d={path} fill="#0f172a" />
    </svg>
  )
}
