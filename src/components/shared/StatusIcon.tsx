import { Circle, CircleCheck, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TaskStatus } from "@/types/task"

type StatusIconProps = {
  status: TaskStatus
  className?: string
}

const statusIcons: Record<TaskStatus, React.ComponentType<{ className?: string }>> = {
  todo: Circle,
  in_progress: Clock,
  done: CircleCheck,
}

const statusColors: Record<TaskStatus, string> = {
  todo: "text-muted-foreground",
  in_progress: "text-yellow-500",
  done: "text-emerald-500",
}

export function StatusIcon({ status, className }: StatusIconProps) {
  const Icon = statusIcons[status] ?? Circle
  return (
    <div title={status}>
      <Icon
        className={cn("size-4 shrink-0", statusColors[status] ?? "text-muted-foreground", className)}
      />
    </div>
  )
}
