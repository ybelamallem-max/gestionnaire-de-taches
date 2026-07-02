import { useCallback, useEffect, useState } from "react"

import { api } from "@/services/api"
import { getApiMessage } from "@/services/apiErrors"
import type { ApiProject, Project } from "@/types/project"
import { normalizeProject } from "@/types/project"

export function useArchive() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.get<{ projects: ApiProject[] }>("/projects/archive")
      setProjects((res.data.projects ?? []).map(normalizeProject))
    } catch (err: unknown) {
      setError(getApiMessage(err, "Erreur lors du chargement de l'archive."))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateProject = useCallback(
    async (id: Project["id"], payload: any) => {
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

  const unarchiveProject = useCallback(async (id: Project["id"]) => {
    setError(null)
    try {
      const res = await api.put<{ project: ApiProject }>(`/projects/${id}`, { status: "active" })
      const updated = res.data.project ? normalizeProject(res.data.project) : null
      if (updated?.id != null) setProjects((prev) => prev.filter((project) => project.id !== id))
      return updated
    } catch (err: unknown) {
      setError(getApiMessage(err, "Erreur lors du désarchivage du projet."))
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
    updateProject,
    deleteProject,
    unarchiveProject,
  }
}
