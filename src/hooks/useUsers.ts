import { useCallback, useEffect, useState } from "react"

import { api } from "@/services/api"
import { getApiMessage } from "@/services/apiErrors"

export type MentionUser = {
  id: string | number
  name: string
  email: string
  tag?: string | null
}

export function useUsers() {
  const [users, setUsers] = useState<MentionUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.get<{ users: MentionUser[] }>("/users")
      setUsers(res.data.users ?? [])
    } catch (err: unknown) {
      setError(getApiMessage(err, "Erreur lors du chargement des utilisateurs."))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    users,
    isLoading,
    error,
    refresh,
  }
}
