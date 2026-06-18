import type { TaskPriority, TaskStatus, TaskTag } from "@/hooks/useTasks"

export function priorityLabel(priority: TaskPriority) {
  if (priority === "high") return "Haute"
  if (priority === "medium") return "Moyenne"
  return "Faible"
}

export function statusLabel(status: TaskStatus) {
  if (status === "done") return "Terminée"
  if (status === "in_progress") return "En cours"
  return "À faire"
}

export function priorityBadgeClass(priority: TaskPriority) {
  if (priority === "high") return "bg-red-500/15 text-red-300 ring-1 ring-red-500/25"
  if (priority === "medium") return "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/25"
  return "bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/25"
}

export function statusBadgeClass(status: TaskStatus) {
  if (status === "done") return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25"
  if (status === "in_progress") return "bg-zinc-500/15 text-zinc-200 ring-1 ring-zinc-500/25"
  return "bg-sky-500/15 text-sky-200 ring-1 ring-sky-500/25"
}

export function tagStyle(tag: Pick<TaskTag, "color">) {
  return {
    backgroundColor: `${tag.color}22`,
    color: tag.color,
    borderColor: `${tag.color}44`,
  }
}
