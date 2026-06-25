export type TeamRole = "owner" | "admin" | "member"
export type TeamMembershipStatus = "pending_invite" | "pending_request" | "accepted" | "rejected"

export type ApiTeamMember = {
  id?: string | number
  name?: string | null
  email?: string | null
  tag?: string | null
  pivot?: { role?: TeamRole; status?: TeamMembershipStatus } | null
}

export type TeamMember = {
  id?: string | number
  user_id?: string | number
  role: TeamRole
  status?: TeamMembershipStatus
  name?: string | null
  email?: string | null
  tag?: string | null
  user?: {
    id?: string | number
    name?: string | null
    email?: string | null
    tag?: string | null
  } | null
}

export type Team = {
  id: string | number
  name: string
  description?: string | null
  members?: TeamMember[]
  allMembers?: TeamMember[]
  members_count?: number
  owner?: {
    id?: string | number
    name?: string | null
    tag?: string | null
  } | null
  user_membership?: {
    status?: TeamMembershipStatus
    role?: TeamRole
  } | null
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
  allMembers?: ApiTeamMember[]
  all_members?: ApiTeamMember[]
  members_count?: number
  owner?: {
    id?: string | number
    name?: string | null
    tag?: string | null
  } | null
  user_membership?: {
    status?: TeamMembershipStatus
    role?: TeamRole
  } | null
}

export function normalizeTeam(team: ApiTeam): Team {
  return {
    id: team.id,
    name: team.name,
    description: team.description ?? null,
    members: (team.members ?? []).map((m) => ({
      user_id: m.id,
      role: m.pivot?.role ?? "member",
      status: m.pivot?.status,
      name: m.name ?? null,
      email: m.email ?? null,
      tag: m.tag ?? null,
      user: { id: m.id, name: m.name ?? null, email: m.email ?? null, tag: m.tag ?? null },
    })),
    allMembers: (team.allMembers ?? team.all_members ?? []).map((m) => ({
      user_id: m.id,
      role: m.pivot?.role ?? "member",
      status: m.pivot?.status,
      name: m.name ?? null,
      email: m.email ?? null,
      tag: m.tag ?? null,
      user: { id: m.id, name: m.name ?? null, email: m.email ?? null, tag: m.tag ?? null },
    })),
    members_count: team.members_count,
    owner: team.owner ?? null,
    user_membership: team.user_membership ?? null,
  }
}
