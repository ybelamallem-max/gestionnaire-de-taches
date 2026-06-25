import { MoreHorizontal, Users, Send, Trash2 } from "lucide-react"

import { TeamMembersDialog } from "@/components/teams/TeamMembersDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDisplayName } from "@/lib/users"
import type { Team, TeamRole } from "@/types/team"

type TeamLineProps = {
  team: Team
  onAddMember: (
    teamId: string | number,
    payload: { user_id: string; role: TeamRole }
  ) => Promise<void>
  onUpdateRole: (
    teamId: string | number,
    userId: string | number,
    role: TeamRole
  ) => Promise<void>
  onRemoveMember: (teamId: string | number, userId: string | number) => Promise<void>
  onRequestToJoin?: (teamId: string | number) => Promise<void>
  onInvite?: (teamId: string | number, identifier: string) => Promise<void>
  onAcceptMembership?: (teamId: string | number, userId: string | number) => Promise<void>
  onRejectMembership?: (teamId: string | number, userId: string | number) => Promise<void>
  onDeleteTeam?: (teamId: string | number) => Promise<void>
}

export function TeamLine({
  team,
  onAddMember,
  onUpdateRole,
  onRemoveMember,
  onRequestToJoin,
  onInvite,
  onAcceptMembership,
  onRejectMembership,
  onDeleteTeam,
}: TeamLineProps) {
  const memberCount = team.members_count ?? team.members?.length ?? 0
  const membership = team.user_membership

  const isMember = membership?.status === "accepted"
  const isPending = membership?.status === "pending_invite" || membership?.status === "pending_request"
  const isOwner = membership?.role === "owner"
  const canDelete = isOwner && memberCount === 1

  return (
    <div className="group issue-line border-b border-border last:border-b-0">
      <div className="inline-flex size-6 shrink-0 items-center justify-center rounded bg-muted">
        <Users className="size-3.5 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate text-sm font-medium text-foreground">{team.name}</div>
          {isMember && (
            <Badge variant="secondary" className="text-xs">
              Membre
            </Badge>
          )}
          {isPending && (
            <Badge variant="outline" className="text-xs">
              En attente
            </Badge>
          )}
        </div>
        {team.description ? (
          <div className="truncate text-xs text-muted-foreground">{team.description}</div>
        ) : null}
        {team.owner && (
          <div className="truncate text-xs text-muted-foreground">
            Par {formatDisplayName(team.owner)}
          </div>
        )}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <span className="text-xs text-muted-foreground">
          {memberCount} membre{memberCount > 1 ? "s" : ""}
        </span>

        {canDelete && onDeleteTeam && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void onDeleteTeam(team.id)}
            className="h-7 text-xs text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-1 size-3" />
            Supprimer
          </Button>
        )}

        {!isMember && !isPending && onRequestToJoin && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void onRequestToJoin(team.id)}
            className="h-7 text-xs"
          >
            <Send className="mr-1 size-3" />
            Demander
          </Button>
        )}

        <TeamMembersDialog
          team={team}
          onAddMember={onAddMember}
          onUpdateRole={onUpdateRole}
          onRemoveMember={onRemoveMember}
          onInvite={onInvite}
          onAcceptMembership={onAcceptMembership}
          onRejectMembership={onRejectMembership}
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          }
        />
      </div>
    </div>
  )
}
