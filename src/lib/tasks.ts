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
  if (priority === "high") return "bg-destructive/10 text-destructive"
  if (priority === "medium") return "bg-amber-500/10 text-amber-700 dark:text-amber-300"
  return "bg-secondary text-secondary-foreground"
}

export function statusBadgeClass(status: TaskStatus) {
  if (status === "done") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  if (status === "in_progress") return "bg-amber-500/10 text-amber-700 dark:text-amber-300"
  return "bg-secondary text-secondary-foreground"
}

export function tagStyle(tag: Pick<TaskTag, "color">) {
  return {
    backgroundColor: `${tag.color}22`,
    color: tag.color,
    borderColor: `${tag.color}44`,
  }
}
