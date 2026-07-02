import { Circle, CircleCheck, Archive } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProjectStatus } from "@/types/project"

type ProjectStatusIconProps = {
  status: ProjectStatus
  className?: string
}

const statusIcons: Record<ProjectStatus, React.ComponentType<{ className?: string }>> = {
  active: Circle,
  completed: CircleCheck,
  archived: Archive,
}

const statusColors: Record<ProjectStatus, string> = {
  active: "text-amber-500",
  completed: "text-emerald-500",
  archived: "text-muted-foreground",
}

export function ProjectStatusIcon({ status, className }: ProjectStatusIconProps) {
  const Icon = statusIcons[status]
  return (
    <div title={status}>
      <Icon
        className={cn("size-4 shrink-0", statusColors[status], className)}
      />
    </div>
  )
}
