import type { ReactNode } from "react"

import { FieldError } from "@/components/ui/field-error"
import { cn } from "@/lib/utils"
import type { ApiValidationErrors } from "@/services/apiErrors"

type FormFieldProps = {
  label: string
  htmlFor?: string
  error?: ApiValidationErrors[string]
  children: ReactNode
  className?: string
}

export function FormField({ label, htmlFor, error, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-foreground">
        {label}
      </label>
      {children}
      <FieldError errors={error} />
    </div>
  )
}

export function FormTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
        className
      )}
      {...props}
    />
  )
}

export function FormActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      {children}
    </div>
  )
}
