import { useMemo, useState } from "react"
import { format, isValid, parseISO } from "date-fns"
import { fr } from "date-fns/locale"

import { Circle, CircleCheck, Clock, CircleUserRound, GripVertical } from "lucide-react"

import { PriorityDot } from "@/components/shared/PriorityDot"
import { Badge } from "@/components/ui/badge"
import { statusLabel } from "@/lib/tasks"
import type { Task } from "@/types/task"

type TaskBoardProps = {
  tasks: Task[]
  onMove: (task: Task, status: Task["status"]) => Promise<void> | void
  onToggle: (id: Task["id"]) => void
  onDelete: (id: Task["id"]) => void
  onEdit: (task: Task) => void
  onOpenDetails: (task: Task) => void
}

function formatDeadline(deadline: string | null | undefined) {
  if (!deadline) return null
  const parsed = parseISO(deadline)
  if (!isValid(parsed)) return null
  return format(parsed, "dd MMM", { locale: fr })
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
  const [overStatus, setOverStatus] = useState<Task["status"] | null>(null)

  const groupedTasks = useMemo(() => {
    return columns.reduce<Record<Task["status"], Task[]>>(
      (acc, status) => {
        acc[status] = tasks.filter((task) => task.status === status)
        return acc
      },
      { todo: [], in_progress: [], done: [] }
    )
  }, [tasks])

  if (!tasks.length) {
    return <div className="empty-state">Aucune tâche pour le moment.</div>
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {columns.map((status) => {
        const items = groupedTasks[status]
        const isOver = overStatus === status

        const bgColors = {
          todo: "bg-slate-50 dark:bg-[#4f545c]/30",
          in_progress: "bg-amber-50 dark:bg-[#faa61a]/20",
          done: "bg-emerald-50 dark:bg-[#3ba55c]/20"
        }

        const iconColors = {
          todo: "text-slate-500 dark:text-[#b9bbbe]",
          in_progress: "text-amber-600 dark:text-[#faa61a]",
          done: "text-emerald-600 dark:text-[#3ba55c]"
        }

        const StatusIcon = status === "todo" ? Circle : status === "in_progress" ? Clock : CircleCheck

        return (
          <section
            key={status}
            className={`kanban-column ${isOver ? "ring-2 ring-primary/50" : ""}`}
            onDragOver={(event) => {
              event.preventDefault()
              if (overStatus !== status) setOverStatus(status)
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setOverStatus((current) => (current === status ? null : current))
              }
            }}
            onDrop={async (event) => {
              event.preventDefault()
              const taskId = event.dataTransfer.getData("text/task-id") || draggedTaskId
              const task = tasks.find((item) => String(item.id) === taskId)
              setDraggedTaskId(null)
              setOverStatus(null)
              if (!task || task.status === status) return
              await onMove(task, status)
            }}
          >
            <div className={`flex items-center justify-between px-4 py-3 rounded-lg ${bgColors[status]}`}>
              <div className="flex items-center gap-2">
                <StatusIcon className={`size-4 ${iconColors[status]}`} />
                <span className="text-sm font-semibold">{statusLabel(status)}</span>
              </div>
              <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px]">
                {items.length}
              </Badge>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-3">
              {items.length ? (
                items.map((task) => {
                  const deadline = formatDeadline(task.deadline)
                  return (
                    <article
                      key={String(task.id)}
                      role="button"
                      tabIndex={0}
                      draggable
                      className={`kanban-card text-left ${draggedTaskId === String(task.id) ? "opacity-60 ring-2 ring-primary/50" : ""}`}
                      onClick={() => onOpenDetails(task)}
                      onDragStart={(event) => {
                        setDraggedTaskId(String(task.id))
                        event.dataTransfer.effectAllowed = "move"
                        event.dataTransfer.setData("text/task-id", String(task.id))
                      }}
                      onDragEnd={() => {
                        setDraggedTaskId(null)
                        setOverStatus(null)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          onOpenDetails(task)
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <GripVertical className="size-4 shrink-0 text-muted-foreground" />
                            <div className="truncate text-sm font-medium text-foreground">{task.title}</div>
                          </div>
                          {task.description ? (
                            <div className="mt-1 line-clamp-2 pl-6 text-xs text-muted-foreground">
                              {task.description}
                            </div>
                          ) : null}
                        </div>
                        <PriorityDot priority={task.priority} />
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span className="truncate">{task.project || "Sans projet"}</span>
                        {deadline && (
                          <span className="shrink-0">{deadline}</span>
                        )}
                        <span className="shrink-0">
                          {task.assignee?.name || task.assignee?.email ? (
                            task.assignee?.name || task.assignee?.email
                          ) : (
                            <CircleUserRound className="size-4" />
                          )}
                        </span>
                      </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex h-7 items-center rounded-md border border-border px-2 text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                        onClick={(event) => {
                          event.stopPropagation()
                          onToggle(task.id)
                        }}
                      >
                        Changer d'état
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-7 items-center rounded-md border border-border px-2 text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                        onClick={(event) => {
                          event.stopPropagation()
                          onEdit(task)
                        }}
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-7 items-center rounded-md border border-destructive/30 px-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={(event) => {
                          event.stopPropagation()
                          onDelete(task.id)
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </article>
                  )
                })
              ) : (
                <div
                  className={`flex flex-1 items-center justify-center rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground ${isOver ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  {isOver ? "Déposez la tâche ici." : "Aucune tâche dans cette colonne."}
                </div>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
