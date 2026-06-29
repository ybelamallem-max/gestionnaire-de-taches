import { useState } from "react"
import { Plus, Search } from "lucide-react"

import { TeamForm } from "@/components/teams/TeamForm"
import { TeamLine } from "@/components/teams/TeamLine"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { TeamPayload, TeamRole } from "@/types/team"
import { useTeams } from "@/hooks/useTeams"
import type { ApiValidationErrors } from "@/services/apiErrors"
import { getValidationErrors } from "@/services/apiErrors"

export default function Teams() {
  const { teams, isLoading, error, createTeam, addMember, updateMemberRole, removeMember, requestToJoin, invite, acceptMembership, rejectMembership, deleteTeam } =
    useTeams()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createErrors, setCreateErrors] = useState<ApiValidationErrors | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (team.description && team.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

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

  async function handleRequestToJoin(teamId: string | number) {
    await requestToJoin(teamId)
  }

  async function handleInvite(teamId: string | number, identifier: string) {
    await invite(teamId, identifier)
  }

  async function handleAcceptMembership(teamId: string | number, userId: string | number) {
    await acceptMembership(teamId, userId)
  }

  async function handleRejectMembership(teamId: string | number, userId: string | number) {
    await rejectMembership(teamId, userId)
  }

  async function handleDeleteTeam(teamId: string | number) {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette équipe ?")) {
      await deleteTeam(teamId)
    }
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
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une équipe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
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
        ) : filteredTeams.length ? (
          <div className="list-shell divide-y">
            {filteredTeams.map((team) => (
              <TeamLine
                key={String(team.id)}
                team={team}
                onAddMember={handleAddMember}
                onUpdateRole={handleUpdateRole}
                onRemoveMember={handleRemoveMember}
                onRequestToJoin={handleRequestToJoin}
                onInvite={handleInvite}
                onAcceptMembership={handleAcceptMembership}
                onRejectMembership={handleRejectMembership}
                onDeleteTeam={handleDeleteTeam}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            {searchQuery ? "Aucune équipe ne correspond à votre recherche." : "Aucune équipe pour le moment."}
          </div>
        )}
      </div>
    </div>
  )
}
