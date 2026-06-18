import { cn } from "@/lib/utils"

type SpinnerProps = {
  className?: string
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <div
      className={cn(
        "size-4 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-100",
        className
      )}
      aria-label="Chargement"
    />
  )
}

