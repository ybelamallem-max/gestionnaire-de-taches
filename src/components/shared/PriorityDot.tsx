import { cn } from "@/lib/utils"
import type { TaskPriority } from "@/types/task"

type PriorityDotProps = {
  priority: TaskPriority
  className?: string
}

const priorityColors: Record<TaskPriority, string> = {
  low: "bg-blue-400",
  medium: "bg-orange-400",
  high: "bg-red-500",
}

export function PriorityDot({ priority, className }: PriorityDotProps) {
  return (
    <div
      className={cn("size-2 shrink-0 rounded-full", priorityColors[priority], className)}
      title={priority}
    />
  )
}
