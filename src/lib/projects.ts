import type { Project, ProjectStatus } from "@/hooks/useProjects"

export function projectStatusLabel(status: ProjectStatus) {
  if (status === "completed") return "Terminé"
  if (status === "archived") return "Archivé"
  return "Actif"
}

export function projectStatusBadgeClass(status: ProjectStatus) {
  if (status === "completed") return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25"
  if (status === "archived") return "bg-zinc-500/15 text-zinc-200 ring-1 ring-zinc-500/25"
  return "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25"
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
