import type { Task } from "@/hooks/useTasks"
import { TaskCard } from "@/components/tasks/TaskCard"

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
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6 text-sm text-zinc-300">
        Aucune tâche pour le moment.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {tasks.map((task) => (
        <TaskCard
          key={String(task.id)}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          onOpenDetails={onOpenDetails}
        />
      ))}
    </div>
  )
}
