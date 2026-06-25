import { useCallback, useEffect, useState } from "react"

import { api } from "@/services/api"
import { getApiMessage } from "@/services/apiErrors"
import type {
  ApiTeam,
  ApiTeamMember,
  Team,
  TeamMember,
  TeamPayload,
  TeamRole,
} from "@/types/team"
import { normalizeTeam } from "@/types/team"


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
      setError(getApiMessage(err, "Erreur lors du chargement des équipes."))
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
        return created
      } catch (err: unknown) {
        setError(getApiMessage(err, "Erreur lors de la création de l'équipe."))
        throw err
      }
    },
    []
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
        setError(getApiMessage(err, "Erreur lors de l'ajout du membre."))
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
        setError(getApiMessage(err, "Erreur lors du changement de rôle."))
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
      setError(getApiMessage(err, "Erreur lors de l'exclusion du membre."))
      throw err
    }
  }, [replaceTeam])

  const invite = useCallback(async (teamId: Team["id"], identifier: string) => {
    setError(null)
    try {
      const res = await api.post<{ team: ApiTeam }>(`/teams/${teamId}/invite`, { identifier })
      const returnedTeam = res.data.team ? normalizeTeam(res.data.team) : null
      if (returnedTeam?.id != null) replaceTeam(returnedTeam)
      return returnedTeam
    } catch (err: unknown) {
      setError(getApiMessage(err, "Erreur lors de l'invitation."))
      throw err
    }
  }, [replaceTeam])

  const requestToJoin = useCallback(async (teamId: Team["id"]) => {
    setError(null)
    try {
      const res = await api.post<{ team: ApiTeam }>(`/teams/${teamId}/request`)
      const returnedTeam = res.data.team ? normalizeTeam(res.data.team) : null
      if (returnedTeam?.id != null) replaceTeam(returnedTeam)
      return returnedTeam
    } catch (err: unknown) {
      setError(getApiMessage(err, "Erreur lors de la demande."))
      throw err
    }
  }, [replaceTeam])

  const acceptMembership = useCallback(async (teamId: Team["id"], userId: string | number) => {
    setError(null)
    try {
      const res = await api.put<{ team: ApiTeam }>(`/teams/${teamId}/members/${userId}/accept`)
      const returnedTeam = res.data.team ? normalizeTeam(res.data.team) : null
      if (returnedTeam?.id != null) replaceTeam(returnedTeam)
      return returnedTeam
    } catch (err: unknown) {
      setError(getApiMessage(err, "Erreur lors de l'acceptation."))
      throw err
    }
  }, [replaceTeam])

  const rejectMembership = useCallback(async (teamId: Team["id"], userId: string | number) => {
    setError(null)
    try {
      const res = await api.put<{ team: ApiTeam }>(`/teams/${teamId}/members/${userId}/reject`)
      const returnedTeam = res.data.team ? normalizeTeam(res.data.team) : null
      if (returnedTeam?.id != null) replaceTeam(returnedTeam)
      return returnedTeam
    } catch (err: unknown) {
      setError(getApiMessage(err, "Erreur lors du refus."))
      throw err
    }
  }, [replaceTeam])

  const deleteTeam = useCallback(async (teamId: Team["id"]) => {
    setError(null)
    try {
      await api.delete(`/teams/${teamId}`)
      setTeams((prev) => prev.filter((t) => t.id !== teamId))
    } catch (err: unknown) {
      setError(getApiMessage(err, "Erreur lors de la suppression de l'équipe."))
      throw err
    }
  }, [])

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
    invite,
    requestToJoin,
    acceptMembership,
    rejectMembership,
    deleteTeam,
  }
}
