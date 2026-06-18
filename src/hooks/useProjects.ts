import { useCallback, useEffect, useState } from "react"

import { api } from "@/services/api"

export type ProjectStatus = "active" | "completed" | "archived"

export type Project = {
  id: string | number
  name: string
  description?: string | null
  status: ProjectStatus
  deadline?: string | null
  team_id?: string | number | null
  team?: { id?: string | number; name?: string | null } | string | null
  tasks_count?: number | null
  completed_tasks_count?: number | null
  total_tasks?: number | null
  completed_tasks?: number | null
  tasks?: Array<{ id?: string | number; status?: string | null }>
}

type ApiProject = {
  id: string | number
  name: string
  description?: string | null
  status: ProjectStatus
  due_date?: string | null
  team_id?: string | number | null
  team?: { id?: string | number; name?: string | null } | null
  tasks?: Array<{ id?: string | number; status?: string | null }>
}

export type ProjectPayload = {
  name: string
  description?: string
  status?: ProjectStatus
  deadline?: string | null
  team_id: string | number
}

function normalizeProject(project: ApiProject): Project {
  return {
    id: project.id,
    name: project.name,
    description: project.description ?? null,
    status: project.status,
    deadline: project.due_date ?? null,
    team_id: project.team_id ?? null,
    team: project.team ?? null,
    tasks: project.tasks ?? [],
  }
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.get<{ projects: ApiProject[] }>("/projects")
      setProjects((res.data.projects ?? []).map(normalizeProject))
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err && "message" in err
          ? String((err as { message?: string }).message)
          : "Erreur lors du chargement des projets."
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createProject = useCallback(
    async (payload: ProjectPayload) => {
      setError(null)
      try {
        const res = await api.post<{ project: ApiProject }>("/projects", payload)
        const created = res.data.project ? normalizeProject(res.data.project) : null
        if (created?.id != null) setProjects((prev) => [created, ...prev])
        await refresh()
        return created
      } catch (err: unknown) {
        const message =
          typeof err === "object" && err && "message" in err
            ? String((err as { message?: string }).message)
            : "Erreur lors de la création du projet."
        setError(message)
        throw err
      }
    },
    [refresh]
  )

  const updateProject = useCallback(
    async (id: Project["id"], payload: ProjectPayload) => {
      setError(null)
      try {
        const res = await api.put<{ project: ApiProject }>(`/projects/${id}`, payload)
        const updated = res.data.project ? normalizeProject(res.data.project) : null
        if (updated?.id != null) setProjects((prev) => prev.map((project) => (project.id === id ? updated : project)))
        await refresh()
        return updated
      } catch (err: unknown) {
        const message =
          typeof err === "object" && err && "message" in err
            ? String((err as { message?: string }).message)
            : "Erreur lors de la mise à jour du projet."
        setError(message)
        throw err
      }
    },
    [refresh]
  )

  const deleteProject = useCallback(async (id: Project["id"]) => {
    setError(null)
    try {
      await api.delete(`/projects/${id}`)
      setProjects((prev) => prev.filter((project) => project.id !== id))
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err && "message" in err
          ? String((err as { message?: string }).message)
          : "Erreur lors de la suppression du projet."
      setError(message)
      throw err
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    projects,
    isLoading,
    error,
    refresh,
    createProject,
    updateProject,
    deleteProject,
  }
}
