import { useCallback, useEffect, useState } from "react"

import { api } from "@/services/api"

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

type ApiTask = {
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
  deadline?: string | null
  project_id: string | number
}

export type TaskUpdatePayload = Partial<TaskUpsertPayload> & {
  status?: TaskStatus
}

function normalizeTask(task: ApiTask): Task {
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

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.get<{ tasks: ApiTask[] }>("/tasks")
      setTasks((res.data.tasks ?? []).map(normalizeTask))
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err && "message" in err
          ? String((err as { message?: string }).message)
          : "Erreur lors du chargement des tâches."
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const replaceTask = useCallback((nextTask: Task) => {
    setTasks((prev) => prev.map((task) => (task.id === nextTask.id ? nextTask : task)))
  }, [])

  const createTask = useCallback(
    async (payload: TaskUpsertPayload) => {
      setError(null)
      try {
        const res = await api.post<{ task: ApiTask }>("/tasks", payload)
        const created = res.data.task ? normalizeTask(res.data.task) : null
        if (created?.id != null) setTasks((prev) => [created, ...prev])
        await refresh()
        return created
      } catch (err: unknown) {
        const message =
          typeof err === "object" && err && "message" in err
            ? String((err as { message?: string }).message)
            : "Erreur lors de la création de la tâche."
        setError(message)
        throw err
      }
    },
    [refresh]
  )

  const updateTask = useCallback(
    async (id: Task["id"], payload: TaskUpdatePayload) => {
      setError(null)
      try {
        const res = await api.put<{ task: ApiTask }>(`/tasks/${id}`, payload)
        const updated = res.data.task ? normalizeTask(res.data.task) : null
        if (updated?.id != null) setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
        return updated
      } catch (err: unknown) {
        const message =
          typeof err === "object" && err && "message" in err
            ? String((err as { message?: string }).message)
            : "Erreur lors de la mise à jour de la tâche."
        setError(message)
        throw err
      }
    },
    []
  )

  const deleteTask = useCallback(async (id: Task["id"]) => {
    setError(null)
    try {
      await api.delete(`/tasks/${id}`)
      setTasks((prev) => prev.filter((t) => t.id !== id))
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err && "message" in err
          ? String((err as { message?: string }).message)
          : "Erreur lors de la suppression de la tâche."
      setError(message)
      throw err
    }
  }, [])

  const toggleTask = useCallback(
    async (id: Task["id"]) => {
      setError(null)
      try {
        const res = await api.patch<{ task: ApiTask }>(`/tasks/${id}/toggle`)
        const updated = res.data.task ? normalizeTask(res.data.task) : null
        if (updated?.id != null) setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
        return updated
      } catch (err: unknown) {
        const message =
          typeof err === "object" && err && "message" in err
            ? String((err as { message?: string }).message)
            : "Erreur lors de la mise à jour du statut."
        setError(message)
        throw err
      }
    },
    []
  )

  const assignTask = useCallback(
    async (id: Task["id"], userId: string | number) => {
      setError(null)
      try {
        const res = await api.post<{ task: ApiTask }>(`/tasks/${id}/assign`, { user_id: userId })
        const updated = res.data.task ? normalizeTask(res.data.task) : null
        if (updated?.id != null) setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
        return updated
      } catch (err: unknown) {
        const message =
          typeof err === "object" && err && "message" in err
            ? String((err as { message?: string }).message)
            : "Erreur lors de l'assignation."
        setError(message)
        throw err
      }
    },
    []
  )

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    tasks,
    isLoading,
    error,
    refresh,
    setTasks,
    replaceTask,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    assignTask,
  }
}
