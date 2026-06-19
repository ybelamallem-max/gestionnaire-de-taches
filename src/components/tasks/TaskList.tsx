import type { Task } from "@/hooks/useTasks"
import { TaskLine } from "@/components/tasks/TaskLine"

type TaskListProps = {
  tasks: Task[]
  onToggle: (id: Task["id"]) => void
  onDelete: (id: Task["id"]) => void
  onEdit: (task: Task) => void
  onOpenDetails: (task: Task) => void
}

export function TaskList({
  tasks,
  onToggle,
  onDelete,
  onEdit,
  onOpenDetails,
}: TaskListProps) {
  if (!tasks.length) {
    return <div className="empty-state">Aucune tâche pour le moment.</div>
  }

  return (
    <div className="list-shell">
      <div className="hidden items-center gap-3 border-b px-6 py-2 text-[11px] uppercase tracking-wide text-muted-foreground sm:flex">
        <span className="w-7 shrink-0" />
        <span className="min-w-0 flex-1">Tâche</span>
        <span className="w-[120px] shrink-0">Projet</span>
        <span className="w-14 shrink-0 text-right">Deadline</span>
        <span className="w-6 shrink-0" />
        <span className="w-7 shrink-0" />
      </div>
      <div className="divide-y">
        {tasks.map((task) => (
          <TaskLine
            key={String(task.id)}
            task={task}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
            onOpenDetails={onOpenDetails}
          />
        ))}
      </div>
    </div>
  )
}
