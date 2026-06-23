import { useCallback, useEffect, useState } from "react"

import { api } from "@/services/api"

export type AdminUserRole = "user" | "admin" | "responsable"
export type AdminUserGender = "male" | "female" | "other"

export type AdminUser = {
  id: string | number
  name: string
  email: string
  phone?: string | null
  birth_date?: string | null
  gender?: AdminUserGender | null
  role: AdminUserRole
  created_at?: string | null
}

export type AdminUserPayload = {
  name: string
  email: string
  phone?: string
  birth_date?: string | null
  gender?: AdminUserGender
  password?: string
  role: AdminUserRole
}

export type AdminUsersPagination = {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}

type PaginatedResult<T> = {
  items: T[]
  pagination: AdminUsersPagination
}

function defaultPagination(): AdminUsersPagination {
  return {
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
  }
}

function extractItem<T>(value: unknown): T | null {
  if (typeof value === "object" && value && !Array.isArray(value)) {
    if ("user" in value && typeof (value as { user?: unknown }).user === "object") {
      return (value as { user: T }).user
    }
    if ("data" in value) {
      const nested = (value as { data?: unknown }).data
      if (typeof nested === "object" && nested && !Array.isArray(nested)) {
        return nested as T
      }
    }

    return value as T
  }

  return null
}

function extractPaginatedList<T>(value: unknown): PaginatedResult<T> {
  if (typeof value === "object" && value && "users" in value && Array.isArray((value as { users?: unknown }).users)) {
    const items = (value as { users: T[] }).users
    return {
      items,
      pagination: {
        currentPage: 1,
        lastPage: 1,
        perPage: items.length,
        total: items.length,
      },
    }
  }

  if (Array.isArray(value)) {
    return {
      items: value as T[],
      pagination: {
        currentPage: 1,
        lastPage: 1,
        perPage: value.length,
        total: value.length,
      },
    }
  }

  if (typeof value !== "object" || !value) {
    return { items: [], pagination: defaultPagination() }
  }

  const source =
    "data" in value &&
    typeof (value as { data?: unknown }).data === "object" &&
    (value as { data?: unknown }).data &&
    !Array.isArray((value as { data?: unknown }).data) &&
    "data" in ((value as { data?: unknown }).data as object)
      ? ((value as { data?: unknown }).data as Record<string, unknown>)
      : (value as Record<string, unknown>)

  const items = Array.isArray(source.data) ? (source.data as T[]) : []

  return {
    items,
    pagination: {
      currentPage:
        typeof source.current_page === "number" ? source.current_page : 1,
      lastPage: typeof source.last_page === "number" ? source.last_page : 1,
      perPage: typeof source.per_page === "number" ? source.per_page : items.length,
      total: typeof source.total === "number" ? source.total : items.length,
    },
  }
}

function getErrorMessage(err: unknown, fallback: string) {
  if (typeof err === "object" && err) {
    if ("response" in err) {
      const response = (err as { response?: { data?: { message?: unknown } } }).response
      if (typeof response?.data?.message === "string" && response.data.message.trim()) {
        return response.data.message
      }
    }

    if ("message" in err && typeof (err as { message?: unknown }).message === "string") {
      return String((err as { message?: string }).message)
    }
  }

  return fallback
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [pagination, setPagination] = useState<AdminUsersPagination>(defaultPagination)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await api.get("/admin/users")
      const parsed = extractPaginatedList<AdminUser>(res.data)
      setUsers(parsed.items)
      setPagination(parsed.pagination)
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Erreur lors du chargement des utilisateurs."))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createUser = useCallback(
    async (payload: AdminUserPayload) => {
      setError(null)

      try {
        const res = await api.post("/admin/users", payload)
        const created = extractItem<AdminUser>(res.data)
        await refresh()
        return created
      } catch (err: unknown) {
        const message = getErrorMessage(err, "Erreur lors de la création de l'utilisateur.")
        setError(message)
        throw err
      }
    },
    [refresh]
  )

  const updateUser = useCallback(
    async (id: AdminUser["id"], payload: AdminUserPayload) => {
      setError(null)

      try {
        const res = await api.put(`/admin/users/${id}`, payload)
        const updated = extractItem<AdminUser>(res.data)
        await refresh()
        return updated
      } catch (err: unknown) {
        const message = getErrorMessage(err, "Erreur lors de la mise à jour de l'utilisateur.")
        setError(message)
        throw err
      }
    },
    [refresh]
  )

  const deleteUser = useCallback(
    async (id: AdminUser["id"]) => {
      setError(null)

      try {
        await api.delete(`/admin/users/${id}`)
        await refresh()
      } catch (err: unknown) {
        const message = getErrorMessage(err, "Erreur lors de la suppression de l'utilisateur.")
        setError(message)
        throw err
      }
    },
    [refresh]
  )

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    users,
    pagination,
    isLoading,
    error,
    refresh,
    createUser,
    updateUser,
    deleteUser,
  }
}
