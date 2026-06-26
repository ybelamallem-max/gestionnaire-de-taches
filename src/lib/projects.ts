import type { Project, ProjectStatus } from "@/hooks/useProjects"

export function projectStatusLabel(status: ProjectStatus) {
  if (status === "completed") return "Terminé"
  if (status === "archived") return "Archivé"
  return "Actif"
}

export function projectStatusBadgeClass(status: ProjectStatus) {
  if (status === "completed") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  if (status === "archived") return "bg-secondary text-secondary-foreground"
  return "bg-amber-500/10 text-amber-700 dark:text-amber-300"
}

export function getProjectProgress(project: Project) {
  if (
    typeof project.completed_tasks_count === "number" &&
    typeof project.tasks_count === "number"
  ) {
    return { done: project.completed_tasks_count, total: project.tasks_count }
  }

  if (
    typeof project.completed_tasks === "number" &&
    typeof project.total_tasks === "number"
  ) {
    return { done: project.completed_tasks, total: project.total_tasks }
  }

  if (Array.isArray(project.tasks)) {
    const total = project.tasks.length
    const done = project.tasks.filter((task) => task.status === "done").length
    return { done, total }
  }

  return { done: 0, total: 0 }
}

export function getProjectTeamName(project: Project) {
  if (typeof project.team === "string" && project.team.trim()) return project.team
  if (typeof project.team === "object" && project.team?.name) return project.team.name
  return "—"
}

export function getProjectOwnerName(project: Project) {
  if (typeof project.owner === "object" && project.owner?.name) return project.owner.name
  return "—"
}
