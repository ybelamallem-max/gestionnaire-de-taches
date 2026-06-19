import { MoreHorizontal, Users } from "lucide-react"

import { TeamMembersDialog } from "@/components/teams/TeamMembersDialog"
import { Button } from "@/components/ui/button"
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
}

export function TeamLine({
  team,
  onAddMember,
  onUpdateRole,
  onRemoveMember,
}: TeamLineProps) {
  const memberCount = team.members?.length ?? 0

  return (
    <div className="group issue-line border-b border-border last:border-b-0">
      <div className="inline-flex size-6 shrink-0 items-center justify-center rounded bg-muted">
        <Users className="size-3.5 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{team.name}</div>
        {team.description ? (
          <div className="truncate text-xs text-muted-foreground">{team.description}</div>
        ) : null}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <span className="text-xs text-muted-foreground">
          {memberCount} membre{memberCount > 1 ? "s" : ""}
        </span>

        <TeamMembersDialog
          team={team}
          onAddMember={onAddMember}
          onUpdateRole={onUpdateRole}
          onRemoveMember={onRemoveMember}
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
