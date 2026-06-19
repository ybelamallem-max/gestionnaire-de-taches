import { useMemo, useState } from "react"

import { StatusIcon } from "@/components/shared/StatusIcon"
import { TaskLine } from "@/components/tasks/TaskLine"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { statusColor, statusLabel } from "@/lib/tasks"
import type { Task } from "@/types/task"

type TaskBoardProps = {
  tasks: Task[]
  onMove: (taskId: Task["id"], status: Task["status"]) => Promise<void> | void
  onToggle: (id: Task["id"]) => void
  onDelete: (id: Task["id"]) => void
  onEdit: (task: Task) => void
  onOpenDetails: (task: Task) => void
}

const columns: Task["status"][] = ["todo", "in_progress", "done"]

export function TaskBoard({
  tasks,
  onMove,
  onToggle,
  onDelete,
  onEdit,
  onOpenDetails,
}: TaskBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [activeColumn, setActiveColumn] = useState<Task["status"] | null>(null)

  const groupedTasks = useMemo(() => {
    return columns.reduce<Record<Task["status"], Task[]>>(
      (acc, status) => {
        acc[status] = tasks.filter((task) => task.status === status)
        return acc
      },
      { todo: [], in_progress: [], done: [] }
    )
  }, [tasks])

  async function handleDrop(status: Task["status"]) {
    if (!draggedTaskId) return
    const task = tasks.find((item) => String(item.id) === draggedTaskId)
    setDraggedTaskId(null)
    setActiveColumn(null)
    if (!task || task.status === status) return
    await onMove(task.id, status)
  }

  if (!tasks.length) {
    return <div className="circle-empty">Aucune tâche pour le moment.</div>
  }

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
      {columns.map((status) => {
        const items = groupedTasks[status]

        return (
          <section
            key={status}
            className={cn(
              "flex min-h-[20rem] flex-col overflow-hidden rounded-lg border border-border bg-muted",
              activeColumn === status && "ring-2 ring-ring/40"
            )}
            onDragOver={(event) => {
              event.preventDefault()
              if (activeColumn !== status) setActiveColumn(status)
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setActiveColumn((current) => (current === status ? null : current))
              }
            }}
            onDrop={() => void handleDrop(status)}
          >
            <div
              className="flex items-center justify-between px-3 py-2"
              style={{ backgroundColor: `${statusColor(status)}10` }}
            >
              <div className="flex items-center gap-2">
                <StatusIcon status={status} className="size-2" />
                <span className="text-sm font-medium">{statusLabel(status)}</span>
                <span className="text-sm text-muted-foreground">{items.length}</span>
              </div>
              <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px]">
                {items.length}
              </Badge>
            </div>

            <div className="flex flex-1 flex-col">
              {items.length ? (
                items.map((task) => (
                  <div
                    key={String(task.id)}
                    draggable
                    onDragStart={() => setDraggedTaskId(String(task.id))}
                    onDragEnd={() => {
                      setDraggedTaskId(null)
                      setActiveColumn(null)
                    }}
                    className={cn(
                      "border-b border-border last:border-b-0",
                      draggedTaskId === String(task.id) && "opacity-60"
                    )}
                  >
                    <TaskLine
                      task={task}
                      compact
                      onToggle={onToggle}
                      onDelete={onDelete}
                      onEdit={onEdit}
                      onOpenDetails={onOpenDetails}
                    />
                  </div>
                ))
              ) : (
                <div className="flex flex-1 items-center justify-center p-4 text-center text-sm text-muted-foreground">
                  Déposez une tâche ici.
                </div>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
