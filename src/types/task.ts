export type TaskPriority = "low" | "medium" | "high"
export type TaskStatus = "todo" | "in_progress" | "done"

export type TaskTag = {
  id: string | number
  name: string
  color: string
}

export type TaskUser = {
  id?: string | number
  name?: string | null
  email?: string | null
} | null

export type ApiTask = {
  id: string | number
  title: string
  description?: string | null
  priority: TaskPriority
  status: TaskStatus
  due_date?: string | null
  project_id?: string | number | null
  project?: { id?: string | number; name?: string | null } | null
  assigned_to?: string | number | null
  assignee?: TaskUser
  tags?: TaskTag[]
}

export type Task = {
  id: string | number
  title: string
  description?: string | null
  priority: TaskPriority
  status: TaskStatus
  deadline?: string | null
  project_id?: string | number | null
  project?: string | null
  assigned_to?: string | number | null
  assignee?: TaskUser
  tags?: TaskTag[]
}

export type TaskUpsertPayload = {
  title: string
  description?: string
  priority?: TaskPriority
  status?: TaskStatus
  deadline?: string | null
  project_id?: string | number | null
}

export type TaskUpdatePayload = Partial<TaskUpsertPayload>

export function normalizeTask(task: ApiTask): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? null,
    priority: task.priority,
    status: task.status,
    deadline: task.due_date ?? null,
    project_id: task.project_id ?? null,
    project: task.project?.name ?? null,
    assigned_to: task.assigned_to ?? null,
    assignee: task.assignee ?? null,
    tags: task.tags ?? [],
  }
}
