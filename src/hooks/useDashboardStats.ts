import { useCallback, useEffect, useState } from "react"

import { api } from "@/services/api"
import { getApiMessage } from "@/services/apiErrors"

export type ProjectSummary = {
  id: string | number
  name: string
  status: string
  team_name?: string | null
  due_date?: string | null
  tasks_total: number
  tasks_done: number
  tasks_in_progress: number
  tasks_todo: number
  progress_percent: number
}

export type DashboardStats = {
  scope: "personal" | "global"
  tasks_total: number
  tasks_done: number
  tasks_in_progress: number
  tasks_todo?: number
  teams_total: number
  projects_total?: number
  projects_active?: number
  projects_completed?: number
  projects_archived?: number
  projects_summary?: ProjectSummary[]
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.get<DashboardStats>("/stats")
      setStats(res.data)
    } catch (err: unknown) {
      setError(getApiMessage(err, "Erreur lors du chargement des statistiques."))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { stats, isLoading, error, refresh }
}
