export type ProjectStatus = "active" | "completed" | "archived"

export type ApiProject = {
  id: string | number
  name: string
  description?: string | null
  status: ProjectStatus
  due_date?: string | null
  team_id?: string | number | null
  team?: { id?: string | number; name?: string | null } | null
  owner?: { id?: string | number; name?: string | null } | null
  tasks?: Array<{ id?: string | number; status?: string | null }>
}

export type Project = {
  id: string | number
  name: string
  description?: string | null
  status: ProjectStatus
  deadline?: string | null
  team_id?: string | number | null
  team?: { id?: string | number; name?: string | null } | string | null
  owner?: { id?: string | number; name?: string | null } | null
  tasks_count?: number | null
  completed_tasks_count?: number | null
  total_tasks?: number | null
  completed_tasks?: number | null
  tasks?: Array<{ id?: string | number; status?: string | null }>
}

export type ProjectPayload = {
  name: string
  description?: string
  status?: ProjectStatus
  deadline?: string | null
  team_id?: string | number | null
}

export function normalizeProject(project: ApiProject): Project {
  return {
    id: project.id,
    name: project.name,
    description: project.description ?? null,
    status: project.status,
    deadline: project.due_date ?? null,
    team_id: project.team_id ?? null,
    team: project.team ?? null,
    owner: project.owner ?? null,
    tasks: project.tasks ?? [],
  }
}
