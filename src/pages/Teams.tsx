import { useState } from "react"
import { Plus } from "lucide-react"

import { TeamForm } from "@/components/teams/TeamForm"
import { TeamLine } from "@/components/teams/TeamLine"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { TeamPayload, TeamRole } from "@/hooks/useTeams"
import { useTeams } from "@/hooks/useTeams"
import type { ApiValidationErrors } from "@/services/apiErrors"
import { getValidationErrors } from "@/services/apiErrors"

export default function Teams() {
  const { teams, isLoading, error, createTeam, addMember, updateMemberRole, removeMember } =
    useTeams()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createErrors, setCreateErrors] = useState<ApiValidationErrors | null>(null)

  async function handleCreate(payload: TeamPayload) {
    setIsSubmitting(true)
    setCreateErrors(null)
    try {
      await createTeam(payload)
      setIsCreateOpen(false)
    } catch (err: unknown) {
      setCreateErrors(getValidationErrors(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAddMember(
    teamId: string | number,
    payload: { user_id: string; role: TeamRole }
  ) {
    await addMember(teamId, payload)
  }

  async function handleUpdateRole(
    teamId: string | number,
    userId: string | number,
    role: TeamRole
  ) {
    await updateMemberRole(teamId, userId, role)
  }

  async function handleRemoveMember(teamId: string | number, userId: string | number) {
    await removeMember(teamId, userId)
  }

  return (
    <div className="h-full">
      <div className="page-header">
        <div>
          <div className="page-title">Équipes</div>
          <div className="page-subtitle">
            {teams.length} équipe{teams.length > 1 ? "s" : ""}
          </div>
        </div>

        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open)
            if (open) setCreateErrors(null)
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              Nouvelle équipe
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouvelle équipe</DialogTitle>
            </DialogHeader>
            <TeamForm
              isSubmitting={isSubmitting}
              errors={createErrors}
              onCancel={() => setIsCreateOpen(false)}
              onSubmit={handleCreate}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="page-section space-y-5">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{teams.length} total</Badge>
        </div>

        {error ? (
          <div className="panel-muted text-destructive">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="empty-state">
            Chargement...
          </div>
        ) : teams.length ? (
          <div className="list-shell divide-y">
            {teams.map((team) => (
              <TeamLine
                key={String(team.id)}
                team={team}
                onAddMember={handleAddMember}
                onUpdateRole={handleUpdateRole}
                onRemoveMember={handleRemoveMember}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            Aucune équipe pour le moment.
          </div>
        )}
      </div>
    </div>
  )
}
