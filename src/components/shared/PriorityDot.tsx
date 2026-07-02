import { AlertTriangle, Signal, SignalHigh, SignalLow, SignalMedium } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TaskPriority } from "@/types/task"

type PriorityDotProps = {
  priority: TaskPriority
  className?: string
}

const priorityIcons: Record<TaskPriority, React.ComponentType<{ className?: string }>> = {
  low: SignalLow,
  medium: SignalMedium,
  high: SignalHigh,
  urgent: AlertTriangle,
}

const priorityColors: Record<TaskPriority, string> = {
  low: "text-blue-500",
  medium: "text-orange-500",
  high: "text-red-500",
  urgent: "text-red-700",
}

export function PriorityDot({ priority, className }: PriorityDotProps) {
  const Icon = priorityIcons[priority] ?? Signal
  return (
    <div title={priority}>
      <Icon
        className={cn("size-4 shrink-0", priorityColors[priority] ?? "text-muted-foreground", className)}
      />
    </div>
  )
}
