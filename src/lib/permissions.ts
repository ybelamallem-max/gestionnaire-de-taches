import type { Project } from "@/types/project"
import type { Task } from "@/types/task"
import type { Team } from "@/types/team"

type CurrentUser = {
  id?: string | number | null
  role?: string | null
} | null | undefined

function sameId(a: string | number | null | undefined, b: string | number | null | undefined) {
  if (a == null || b == null) return false
  return String(a) === String(b)
}

function isGlobalAdmin(user: CurrentUser): boolean {
  return user?.role === "admin" || user?.role === "responsable"
}

/**
 * Seuls l'admin global, le propriétaire du projet, le owner de l'équipe ou
 * un membre de l'équipe avec le rôle owner/admin peuvent modifier ou
 * supprimer un projet.
 */
export function canManageProject(user: CurrentUser, project: Project | null | undefined, teams: Team[]): boolean {
  if (!project) return false
  if (isGlobalAdmin(user)) return true
  if (!user?.id) return false

  if (sameId(project.owner?.id, user.id)) return true

  if (!project.team_id) return false

  const team = teams.find((t) => sameId(t.id, project.team_id))
  if (!team) return false

  if (sameId(team.owner?.id, user.id)) return true

  const membership = team.user_membership
  if (membership?.status === "accepted" && (membership.role === "owner" || membership.role === "admin")) {
    return true
  }

  return false
}

/**
 * Mêmes règles que canManageProject, appliquées à la tâche via son projet.
 */
export function canManageTask(
  user: CurrentUser,
  task: Task | null | undefined,
  projects: Project[],
  teams: Team[]
): boolean {
  if (!task) return false
  const project = projects.find((p) => sameId(p.id, task.project_id))
  return canManageProject(user, project, teams)
}

/** Un utilisateur normal ne peut agir que sur le statut de sa propre tâche assignée. */
export function isTaskAssignee(user: CurrentUser, task: Task | null | undefined): boolean {
  if (!task || !user?.id) return false
  return sameId(task.assigned_to, user.id)
}
