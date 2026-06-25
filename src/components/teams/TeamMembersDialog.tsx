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
import type { Team, TeamMember, TeamRole } from "@/types/team"
import type { ApiValidationErrors } from "@/services/apiErrors"
import { getValidationErrors } from "@/services/apiErrors"

type TeamMembersDialogProps = {
  team: Team
  onAddMember: (teamId: Team["id"], payload: { user_id: string; role: TeamRole }) => Promise<void>
  onInvite?: (teamId: Team["id"], identifier: string) => Promise<void>
  onUpdateRole: (teamId: Team["id"], userId: string | number, role: TeamRole) => Promise<void>
  onRemoveMember: (teamId: Team["id"], userId: string | number) => Promise<void>
  onAcceptMembership?: (teamId: Team["id"], userId: string | number) => Promise<void>
  onRejectMembership?: (teamId: Team["id"], userId: string | number) => Promise<void>
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
  onInvite,
  onUpdateRole,
  onRemoveMember,
  onAcceptMembership,
  onRejectMembership,
  trigger,
}: TeamMembersDialogProps) {
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState("")
  const [identifier, setIdentifier] = useState("")
  const [role, setRole] = useState<TeamRole>("member")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<ApiValidationErrors | null>(null)

  const members = useMemo(() => team.allMembers ?? team.members ?? [], [team.allMembers, team.members])
  const acceptedMembers = useMemo(() => members.filter(m => m.status === "accepted" || !m.status), [members])
  const pendingMembers = useMemo(() => members.filter(m => m.status && m.status !== "accepted"), [members])

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

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!identifier.trim()) return
    setIsSubmitting(true)
    setFieldErrors(null)
    try {
      await onInvite?.(team.id, identifier.trim())
      setIdentifier("")
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
          {onInvite && (
            <form onSubmit={handleInvite} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
              <div className="space-y-1">
                <Input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Nom#Tag (ex: Mohamed#247)"
                />
                <FieldError errors={fieldErrors?.identifier} />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting || !identifier.trim()}
              >
                {isSubmitting ? "Invitation..." : "Inviter"}
              </Button>
            </form>
          )}

          {pendingMembers.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">Demandes en attente</div>
              {pendingMembers.map((member) => {
                const memberId = member.user_id ?? member.user?.id ?? member.id
                return (
                  <div
                    key={getMemberKey(member)}
                    className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-xs"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">
                        {getMemberName(member)}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {member.status === "pending_invite" ? "Invitation envoyée" : "Demande reçue"}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {onAcceptMembership && memberId != null && (
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          onClick={() => void onAcceptMembership(team.id, memberId)}
                        >
                          Accepter
                        </Button>
                      )}
                      {onRejectMembership && memberId != null && (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => void onRejectMembership(team.id, memberId)}
                        >
                          Refuser
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {acceptedMembers.length ? (
            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">Membres</div>
              {acceptedMembers.map((member) => {
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
