import { useCallback, useEffect, useState } from "react"

import { api } from "@/services/api"
import { getApiMessage } from "@/services/apiErrors"

export type DashboardStats = {
  tasks_total: number
  tasks_done: number
  tasks_in_progress: number
  teams_total: number
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

