import { useCallback, useEffect, useState } from "react"

import { api } from "@/services/api"
import { getApiMessage } from "@/services/apiErrors"
import type {
  ApiProject,
  Project,
  ProjectPayload,
  ProjectStatus,
} from "@/types/project"
import { normalizeProject } from "@/types/project"


export type DataScope = "me" | "mine" | "team" | "all"

export function useProjects(scope?: DataScope) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = scope ? { scope } : {}
      const res = await api.get<{ projects: ApiProject[] }>("/projects", { params })
      setProjects((res.data.projects ?? []).map(normalizeProject))
    } catch (err: unknown) {
      setError(getApiMessage(err, "Erreur lors du chargement des projets."))
    } finally {
      setIsLoading(false)
    }
  }, [scope])

  const createProject = useCallback(
    async (payload: ProjectPayload) => {
      setError(null)
      try {
        const res = await api.post<{ project: ApiProject }>("/projects", payload)
        const created = res.data.project ? normalizeProject(res.data.project) : null
        if (created?.id != null) setProjects((prev) => [created, ...prev])
        return created
      } catch (err: unknown) {
        setError(getApiMessage(err, "Erreur lors de la création du projet."))
        throw err
      }
    },
    []
  )

  const updateProject = useCallback(
    async (id: Project["id"], payload: ProjectPayload) => {
      setError(null)
      try {
        const res = await api.put<{ project: ApiProject }>(`/projects/${id}`, payload)
        const updated = res.data.project ? normalizeProject(res.data.project) : null
        if (updated?.id != null) setProjects((prev) => prev.map((project) => (project.id === id ? updated : project)))
        return updated
      } catch (err: unknown) {
        setError(getApiMessage(err, "Erreur lors de la mise à jour du projet."))
        throw err
      }
    },
    []
  )

  const deleteProject = useCallback(async (id: Project["id"]) => {
    setError(null)
    try {
      await api.delete(`/projects/${id}`)
      setProjects((prev) => prev.filter((project) => project.id !== id))
    } catch (err: unknown) {
      setError(getApiMessage(err, "Erreur lors de la suppression du projet."))
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
