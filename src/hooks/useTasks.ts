import { useCallback, useEffect, useState } from "react"

import type { DataScope } from "@/hooks/useProjects"
import { api } from "@/services/api"
import { getApiMessage } from "@/services/apiErrors"
import type {
  ApiTask,
  Task,
  TaskPriority,
  TaskStatus,
  TaskTag,
  TaskUpdatePayload,
  TaskUpsertPayload,
  TaskUser,
} from "@/types/task"
import { normalizeTask } from "@/types/task"

type UseTasksOptions = {
  includeArchived?: boolean
}

export function useTasks(
  scope?: DataScope,
  onProjectCompleted?: () => void,
  options?: UseTasksOptions
) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const includeArchived = options?.includeArchived ?? false

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = {
        ...(scope ? { scope } : {}),
        ...(includeArchived ? { include_archived: true } : {}),
      }
      const res = await api.get<{ tasks: ApiTask[] }>("/tasks", { params })
      setTasks((res.data.tasks ?? []).map(normalizeTask))
    } catch (err: unknown) {
      setError(getApiMessage(err, "Erreur lors du chargement des tâches."))
    } finally {
      setIsLoading(false)
    }
  }, [includeArchived, scope])

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
        return created
      } catch (err: unknown) {
        setError(getApiMessage(err, "Erreur lors de la création de la tâche."))
        throw err
      }
    },
    []
  )

  const updateTask = useCallback(
    async (id: Task["id"], payload: TaskUpdatePayload) => {
      setError(null)
      try {
        const res = await api.put<{ task: ApiTask; project?: any }>(`/tasks/${id}`, payload)
        const updated = res.data.task ? normalizeTask(res.data.task) : null
        if (updated?.id != null) setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
        
        // If project was marked as completed, trigger refresh callback
        if (res.data.project && onProjectCompleted) {
          onProjectCompleted()
        }

        if (res.data.project) {
          await refresh()
        }
        
        return updated
      } catch (err: unknown) {
        setError(getApiMessage(err, "Erreur lors de la mise à jour de la tâche."))
        throw err
      }
    },
    [onProjectCompleted, refresh]
  )

  const deleteTask = useCallback(async (id: Task["id"]) => {
    setError(null)
    try {
      await api.delete(`/tasks/${id}`)
      setTasks((prev) => prev.filter((t) => t.id !== id))
    } catch (err: unknown) {
      setError(getApiMessage(err, "Erreur lors de la suppression de la tâche."))
      throw err
    }
  }, [])

  const toggleTask = useCallback(
    async (id: Task["id"]) => {
      setError(null)
      try {
        const res = await api.patch<{ task: ApiTask; project?: any }>(`/tasks/${id}/toggle`)
        const updated = res.data.task ? normalizeTask(res.data.task) : null
        if (updated?.id != null) setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
        
        // If project was marked as completed, trigger refresh callback
        if (res.data.project && onProjectCompleted) {
          onProjectCompleted()
        }

        if (res.data.project) {
          await refresh()
        }
        
        return updated
      } catch (err: unknown) {
        setError(getApiMessage(err, "Erreur lors de la mise à jour du statut."))
        throw err
      }
    },
    [onProjectCompleted, refresh]
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
        setError(getApiMessage(err, "Erreur lors de l'assignation."))
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
