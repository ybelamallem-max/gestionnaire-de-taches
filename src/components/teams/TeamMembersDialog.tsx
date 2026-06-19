import { useMemo, useState } from "react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { FieldError } from "@/components/ui/field-error"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Team, TeamMember, TeamRole } from "@/hooks/useTeams"
import type { ApiValidationErrors } from "@/services/apiErrors"
import { getValidationErrors } from "@/services/apiErrors"

type TeamMembersDialogProps = {
  team: Team
  onAddMember: (teamId: Team["id"], payload: { user_id: string; role: TeamRole }) => Promise<void>
  onUpdateRole: (teamId: Team["id"], userId: string | number, role: TeamRole) => Promise<void>
  onRemoveMember: (teamId: Team["id"], userId: string | number) => Promise<void>
  trigger?: ReactNode
}

function getMemberName(member: TeamMember) {
  return member.user?.name || member.name || member.user?.email || member.email || "Membre"
}

function getMemberKey(member: TeamMember) {
  return String(member.user_id ?? member.user?.id ?? member.id ?? getMemberName(member))
}

export function TeamMembersDialog({
  team,
  onAddMember,
  onUpdateRole,
  onRemoveMember,
  trigger,
}: TeamMembersDialogProps) {
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState("")
  const [role, setRole] = useState<TeamRole>("member")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<ApiValidationErrors | null>(null)

  const members = useMemo(() => team.members ?? [], [team.members])

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    if (!userId.trim()) return
    setIsSubmitting(true)
    setFieldErrors(null)
    try {
      await onAddMember(team.id, { user_id: userId.trim(), role })
      setUserId("")
      setRole("member")
    } catch (err: unknown) {
      setFieldErrors(getValidationErrors(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline">
            Membres
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Membres de {team.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={handleAddMember} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto]">
            <div className="space-y-1">
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="ID utilisateur"
              />
              <FieldError errors={fieldErrors?.user_id} />
            </div>
            <div className="space-y-1">
              <Select value={role} onValueChange={(value) => setRole(value as TeamRole)}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membre</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner" disabled>
                    Propriétaire
                  </SelectItem>
                </SelectContent>
              </Select>
              <FieldError errors={fieldErrors?.role} />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || !userId.trim()}
            >
              {isSubmitting ? "Ajout..." : "Ajouter"}
            </Button>
          </form>

          {members.length ? (
            <div className="space-y-3">
              {members.map((member) => {
                const memberId = member.user_id ?? member.user?.id ?? member.id
                return (
                  <div
                    key={getMemberKey(member)}
                    className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-xs md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">
                        {getMemberName(member)}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {member.user?.email || member.email || "Aucun email"}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          memberId != null
                            ? void onUpdateRole(team.id, memberId, value as TeamRole)
                            : undefined
                        }
                        disabled={member.role === "owner"}
                      >
                        <SelectTrigger className="h-9 w-full sm:w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Membre</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="owner" disabled>
                            Propriétaire
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={memberId == null}
                        onClick={() =>
                          memberId != null ? void onRemoveMember(team.id, memberId) : undefined
                        }
                      >
                        Exclure
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground shadow-xs">
              Aucun membre dans cette équipe.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
