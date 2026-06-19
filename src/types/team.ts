export type TeamRole = "owner" | "admin" | "member"

export type ApiTeamMember = {
  id?: string | number
  name?: string | null
  email?: string | null
  pivot?: { role?: TeamRole } | null
}

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

export type ApiTeam = {
  id: string | number
  name: string
  description?: string | null
  members?: ApiTeamMember[]
}

export function normalizeTeam(team: ApiTeam): Team {
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
