import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { TaskPriority, TaskStatus } from "@/types/task"

export type TaskStatusFilter = "toutes" | TaskStatus
export type TaskPriorityFilter = "toutes" | TaskPriority

type TaskFiltersValue = {
  status: TaskStatusFilter
  priority: TaskPriorityFilter
}

type TaskFiltersProps = {
  value: TaskFiltersValue
  onChange: (value: TaskFiltersValue) => void
}

export function TaskFilters({ value, onChange }: TaskFiltersProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="text-xs font-medium text-muted-foreground">Statut</div>
        <Select
          value={value.status}
          onValueChange={(v) =>
            onChange({ ...value, status: v as TaskStatusFilter })
          }
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue placeholder="Toutes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="toutes">Toutes</SelectItem>
            <SelectItem value="todo">À faire</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="done">Terminées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        <div className="text-xs font-medium text-muted-foreground">Priorité</div>
        <Select
          value={value.priority}
          onValueChange={(v) =>
            onChange({ ...value, priority: v as TaskPriorityFilter })
          }
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue placeholder="Toutes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="toutes">Toutes</SelectItem>
            <SelectItem value="low">Faible</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="high">Haute</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
