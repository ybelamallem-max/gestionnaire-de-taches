import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { TaskPriority, TaskStatus } from "@/hooks/useTasks"

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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="text-xs font-medium text-zinc-300">Statut</div>
        <Select
          value={value.status}
          onValueChange={(v) =>
            onChange({ ...value, status: v as TaskStatusFilter })
          }
        >
          <SelectTrigger className="h-10 w-full border-zinc-800 bg-zinc-950/40 text-zinc-100 data-[placeholder]:text-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-700/40">
            <SelectValue placeholder="Toutes" />
          </SelectTrigger>
          <SelectContent className="border border-zinc-800 bg-zinc-950 text-zinc-100">
            <SelectItem value="toutes">Toutes</SelectItem>
            <SelectItem value="todo">À faire</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="done">Terminées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        <div className="text-xs font-medium text-zinc-300">Priorité</div>
        <Select
          value={value.priority}
          onValueChange={(v) =>
            onChange({ ...value, priority: v as TaskPriorityFilter })
          }
        >
          <SelectTrigger className="h-10 w-full border-zinc-800 bg-zinc-950/40 text-zinc-100 data-[placeholder]:text-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-700/40">
            <SelectValue placeholder="Toutes" />
          </SelectTrigger>
          <SelectContent className="border border-zinc-800 bg-zinc-950 text-zinc-100">
            <SelectItem value="toutes">Toutes</SelectItem>
            <SelectItem value="low">Faible</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="high">Haute</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
