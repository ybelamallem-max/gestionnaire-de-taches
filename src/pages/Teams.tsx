import { useState } from "react"
import { Plus } from "lucide-react"

import { TeamForm } from "@/components/teams/TeamForm"
import { TeamMembersDialog } from "@/components/teams/TeamMembersDialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
    <div className="h-full rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium text-zinc-100">Équipes</div>
            <div className="text-xs text-zinc-400">
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
              <Button className="bg-zinc-100 text-zinc-950 hover:bg-zinc-100/90">
                <Plus />
                Nouvelle équipe
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-zinc-900 text-zinc-100 ring-zinc-800">
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

        {error ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-200">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6 text-sm text-zinc-300">
            Chargement...
          </div>
        ) : teams.length ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {teams.map((team) => (
              <Card key={String(team.id)} className="bg-zinc-950/40 ring-zinc-800">
                <CardHeader className="gap-2">
                  <CardTitle className="text-base text-zinc-100">{team.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-zinc-300">
                    {team.description || "Aucune description"}
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-400">
                    Membres: <span className="text-zinc-200">{team.members?.length ?? 0}</span>
                  </div>
                </CardContent>
                <CardFooter className="justify-end border-zinc-800 bg-zinc-950/40">
                  <TeamMembersDialog
                    team={team}
                    onAddMember={handleAddMember}
                    onUpdateRole={handleUpdateRole}
                    onRemoveMember={handleRemoveMember}
                  />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6 text-sm text-zinc-300">
            Aucune équipe pour le moment.
          </div>
        )}
      </div>
    </div>
  )
}
