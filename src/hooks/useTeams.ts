import { useCallback, useEffect, useState } from "react"

import { api } from "@/services/api"

export type TeamRole = "owner" | "admin" | "member"

export type TeamMember = {
  id?: string | number
  user_id?: string | number
  role: TeamRole
  name?: string | null
  email?: string | null
  user?: {
    id?: string | number
    name?: string | null
    email?: string | null
  } | null
}

export type Team = {
  id: string | number
  name: string
  description?: string | null
  members?: TeamMember[]
}

export type TeamPayload = {
  name: string
  description?: string
}

type ApiTeamMember = {
  id?: string | number
  name?: string | null
  email?: string | null
  pivot?: { role?: TeamRole } | null
}

type ApiTeam = {
  id: string | number
  name: string
  description?: string | null
  members?: ApiTeamMember[]
}

function normalizeTeam(team: ApiTeam): Team {
  return {
    id: team.id,
    name: team.name,
    description: team.description ?? null,
    members: (team.members ?? []).map((m) => ({
      user_id: m.id,
      role: m.pivot?.role ?? "member",
      name: m.name ?? null,
      email: m.email ?? null,
      user: { id: m.id, name: m.name ?? null, email: m.email ?? null },
    })),
  }
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const replaceTeam = useCallback((nextTeam: Team) => {
    setTeams((prev) => prev.map((team) => (team.id === nextTeam.id ? nextTeam : team)))
  }, [])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.get<{ teams: ApiTeam[] }>("/teams")
      setTeams((res.data.teams ?? []).map(normalizeTeam))
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err && "message" in err
          ? String((err as { message?: string }).message)
          : "Erreur lors du chargement des équipes."
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createTeam = useCallback(
    async (payload: TeamPayload) => {
      setError(null)
      try {
        const res = await api.post<{ team: ApiTeam }>("/teams", payload)
        const created = res.data.team ? normalizeTeam(res.data.team) : null
        if (created?.id != null) setTeams((prev) => [created, ...prev])
        await refresh()
        return created
      } catch (err: unknown) {
        const message =
          typeof err === "object" && err && "message" in err
            ? String((err as { message?: string }).message)
            : "Erreur lors de la création de l'équipe."
        setError(message)
        throw err
      }
    },
    [refresh]
  )

  const addMember = useCallback(
    async (teamId: Team["id"], payload: { user_id: string; role: TeamRole }) => {
      setError(null)
      try {
        const res = await api.post<{ team: ApiTeam }>(`/teams/${teamId}/members`, payload)
        const returnedTeam = res.data.team ? normalizeTeam(res.data.team) : null
        if (returnedTeam?.id != null) replaceTeam(returnedTeam)
        return returnedTeam
      } catch (err: unknown) {
        const message =
          typeof err === "object" && err && "message" in err
            ? String((err as { message?: string }).message)
            : "Erreur lors de l'ajout du membre."
        setError(message)
        throw err
      }
    },
    [replaceTeam]
  )

  const updateMemberRole = useCallback(
    async (teamId: Team["id"], userId: string | number, role: TeamRole) => {
      setError(null)
      try {
        const res = await api.patch<{ team: ApiTeam }>(`/teams/${teamId}/members/${userId}/role`, { role })
        const returnedTeam = res.data.team ? normalizeTeam(res.data.team) : null
        if (returnedTeam?.id != null) replaceTeam(returnedTeam)
        return returnedTeam
      } catch (err: unknown) {
        const message =
          typeof err === "object" && err && "message" in err
            ? String((err as { message?: string }).message)
            : "Erreur lors du changement de rôle."
        setError(message)
        throw err
      }
    },
    [replaceTeam]
  )

  const removeMember = useCallback(async (teamId: Team["id"], userId: string | number) => {
    setError(null)
    try {
      const res = await api.delete<{ team: ApiTeam }>(`/teams/${teamId}/members/${userId}`)
      const returnedTeam = res.data.team ? normalizeTeam(res.data.team) : null
      if (returnedTeam?.id != null) replaceTeam(returnedTeam)
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err && "message" in err
          ? String((err as { message?: string }).message)
          : "Erreur lors de l'exclusion du membre."
      setError(message)
      throw err
    }
  }, [replaceTeam])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    teams,
    isLoading,
    error,
    refresh,
    replaceTeam,
    createTeam,
    addMember,
    updateMemberRole,
    removeMember,
  }
}
