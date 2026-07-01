import { MoreHorizontal, Users, Send, Trash2, X, Check } from "lucide-react"

import { TeamMembersDialog } from "@/components/teams/TeamMembersDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDisplayName } from "@/lib/users"
import type { Team, TeamRole } from "@/types/team"
import { useAuthStore } from "@/stores/authStore"

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
  onCancelRequest?: (teamId: string | number) => Promise<void>
  onLeaveTeam?: (teamId: string | number) => Promise<void>
  onInvite?: (teamId: string | number, identifier: string) => Promise<void>
  onCancelInvite?: (teamId: string | number, userId: string | number) => Promise<void>
  onAcceptInvite?: (teamId: string | number) => Promise<void>
  onRejectInvite?: (teamId: string | number) => Promise<void>
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
  onCancelRequest,
  onLeaveTeam,
  onInvite,
  onCancelInvite,
  onAcceptInvite,
  onRejectInvite,
  onAcceptMembership,
  onRejectMembership,
  onDeleteTeam,
}: TeamLineProps) {
  const currentUser = useAuthStore(s => s.user)
  const memberCount = team.members_count ?? team.members?.length ?? 0
  const membership = team.user_membership

  const isMember = membership?.status === "accepted"
  const isPendingInvite = membership?.status === "pending_invite"
  const isPendingRequest = membership?.status === "pending_request"
  const isPending = isPendingInvite || isPendingRequest
  const isOwner = membership?.role === "owner"
  const canDelete = isOwner && memberCount === 1
  const canManage = currentUser?.role === 'admin' || membership?.role === 'owner' || membership?.role === 'admin'
  const canLeave = isMember && !isOwner

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
          {isPendingInvite && (
            <Badge variant="outline" className="text-xs">
              Invitation en attente
            </Badge>
          )}
        </div>
        {team.description ? (
          <div className="truncate text-xs text-muted-foreground">{team.description}</div>
        ) : null}
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

        {isPendingRequest && onCancelRequest && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void onCancelRequest(team.id)}
            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <X className="mr-1 size-3" />
            Annuler
          </Button>
        )}

        {isPendingInvite && (
          <div className="flex gap-2">
            {onAcceptInvite && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => void onAcceptInvite(team.id)}
                className="size-7 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Check className="size-4" />
              </Button>
            )}
            {onRejectInvite && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => void onRejectInvite(team.id)}
                className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        )}

        {canLeave && onLeaveTeam && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void onLeaveTeam(team.id)}
            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <X className="mr-1 size-3" />
            Quitter
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
          onUpdateRole={onUpdateRole}
          onRemoveMember={onRemoveMember}
          onInvite={onInvite}
          onCancelInvite={onCancelInvite}
          onAcceptInvite={onAcceptInvite}
          onRejectInvite={onRejectInvite}
          onAcceptMembership={onAcceptMembership}
          onRejectMembership={onRejectMembership}
          canManage={canManage}
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
