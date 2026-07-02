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

export type RecentActivity = {
  id: string | number
  type: "task"
  title: string
  status: string
  project_name?: string | null
  updated_at?: string | null
}

export type DashboardStats = {
  scope: "personal" | "global"
  tasks_total: number
  tasks_done: number
  tasks_in_progress: number
  tasks_todo: number
  tasks_overdue: number
  tasks_done_this_week: number
  completion_rate: number
  weekly_completion_rate: number
  teams_total: number
  assigned_tasks_total?: number
  active_assigned_tasks?: number
  workload_percent?: number
  users_total?: number
  active_tasks_total?: number
  workload_average_active_tasks?: number
  projects_total?: number
  projects_active?: number
  projects_completed?: number
  projects_archived?: number
  projects_summary?: ProjectSummary[]
  recent_activity?: RecentActivity[]
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
