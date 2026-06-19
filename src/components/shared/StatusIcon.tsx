import { cn } from "@/lib/utils"
import type { TaskStatus } from "@/types/task"

type StatusIconProps = {
  status: TaskStatus
  className?: string
}

const statusColors: Record<TaskStatus, string> = {
  todo: "bg-zinc-500",
  in_progress: "bg-yellow-400",
  done: "bg-emerald-500",
}

export function StatusIcon({ status, className }: StatusIconProps) {
  return (
    <div
      className={cn("size-2.5 shrink-0 rounded-full", statusColors[status], className)}
      title={status}
    />
  )
}
