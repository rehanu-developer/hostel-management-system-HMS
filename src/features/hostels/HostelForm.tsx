import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { hostelSchema, type HostelFormValues } from "@/lib/schemas"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import type { Hostel } from "@/types"

interface HostelFormProps {
  defaultValues?: Partial<Hostel>
  onSubmit: (values: HostelFormValues) => void
  onCancel: () => void
  submitLabel?: string
  onDirtyChange?: (dirty: boolean) => void
}

export function HostelForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Add Hostel",
  onDirtyChange,
}: HostelFormProps) {
  const form = useForm<HostelFormValues>({
    resolver: zodResolver(hostelSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      location: defaultValues?.location ?? "",
      status: (defaultValues?.status as "Active" | "Inactive") ?? "Active",
      notes: defaultValues?.notes ?? "",
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
                Hostel Information
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Basic details about the hostel.
              </p>
            </div>

            <div className="space-y-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Hostel name</FormLabel>
                    <FormControl>
                      <Input placeholder="Al-Noor Residency" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Block A, Main Boulevard"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h3 className="font-display text-sm font-semibold">Status</h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Inactive hostels are kept for history but won't accept new
                assignments.
              </p>
            </div>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current status</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
