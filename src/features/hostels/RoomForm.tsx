import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { roomSchema } from "@/lib/schemas"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Room, Hostel } from "@/types"
import { useDataStore } from "@/stores/dataStore"

interface RoomFormProps {
  defaultValues?: Partial<Room>
  hostels: Hostel[]
  lockedHostelId?: string // when adding from inside a hostel
  onSubmit: (values: {
    hostelId: string
    number: string
    capacity: number
    monthlyPrice: number
  }) => void
  onCancel: () => void
  submitLabel?: string
  onDirtyChange?: (dirty: boolean) => void
}

export function RoomForm({
  defaultValues,
  hostels,
  lockedHostelId,
  onSubmit,
  onCancel,
  submitLabel = "Add Room",
  onDirtyChange,
}: RoomFormProps) {
  const settings = useDataStore((s) => s.settings)
  const form = useForm({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      hostelId: lockedHostelId ?? defaultValues?.hostelId ?? "",
      number: defaultValues?.number ?? "",
      capacity: defaultValues?.capacity ?? 2,
      monthlyPrice:
        defaultValues?.monthlyPrice ?? settings.defaultMonthlyFee ?? 12000,
    },
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const handleFormSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 350))
    onSubmit(values)
    setIsSubmitting(false)
  })

  useEffect(() => {
    onDirtyChange?.(form.formState.isDirty)
  }, [form.formState.isDirty, onDirtyChange])

  return (
    <Form {...form}>
      <form
        onSubmit={handleFormSubmit}
        className="flex h-full flex-col"
      >
        <div className="flex-1 space-y-5 overflow-y-auto px-1 pr-3">
          <section className="space-y-3">
            <div>
              <h3 className="font-display text-sm font-semibold">
                Room Information
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Rooms have a capacity of 2 to 5 beds.
              </p>
            </div>

            <div className="space-y-3">
              <FormField
                control={form.control}
                name="hostelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Hostel</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!!lockedHostelId}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select hostel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {hostels.map((h) => (
                          <SelectItem key={h.id} value={h.id}>
                            {h.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Room number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Capacity (beds)</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} beds
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="monthlyPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Monthly Price</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--muted-foreground)]">
                          {settings.currency}
                        </span>
                        <Input
                          type="number"
                          min={0}
                          step={500}
                          className="h-9 pl-12"
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? 0
                                : Number(e.target.value),
                            )
                          }
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Default monthly accommodation fee for this room. Used
                      as the source of truth for student fees.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 -mx-1 mt-4 flex items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--background)] px-1 pt-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" isSubmitting={isSubmitting}>
            {isSubmitting ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}
