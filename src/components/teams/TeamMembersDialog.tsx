import { useMemo, useState } from "react"
import type { ReactNode } from "react"

import { Check, X } from "lucide-react"

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
import { useAuthStore } from "@/stores/authStore"

type TeamMembersDialogProps = {
  team: Team
  onInvite?: (teamId: Team["id"], identifier: string) => Promise<void>
  onCancelInvite?: (teamId: Team["id"], userId: string | number) => Promise<void>
  onAcceptInvite?: (teamId: Team["id"]) => Promise<void>
  onRejectInvite?: (teamId: Team["id"]) => Promise<void>
  onUpdateRole: (teamId: Team["id"], userId: string | number, role: TeamRole) => Promise<void>
  onRemoveMember: (teamId: Team["id"], userId: string | number) => Promise<void>
  onAcceptMembership?: (teamId: Team["id"], userId: string | number) => Promise<void>
  onRejectMembership?: (teamId: Team["id"], userId: string | number) => Promise<void>
  trigger?: ReactNode
  canManage: boolean
}

function getMemberName(member: TeamMember) {
  return member.user?.name || member.name || member.user?.email || member.email || "Membre"
}

function getMemberKey(member: TeamMember) {
  return String(member.user_id ?? member.user?.id ?? member.id ?? getMemberName(member))
}

export function TeamMembersDialog({
  team,
  onInvite,
  onCancelInvite,
  onAcceptInvite,
  onRejectInvite,
  onUpdateRole,
  onRemoveMember,
  onAcceptMembership,
  onRejectMembership,
  trigger,
  canManage,
}: TeamMembersDialogProps) {
  const [open, setOpen] = useState(false)
  const [identifier, setIdentifier] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<ApiValidationErrors | null>(null)

  const members = useMemo(() => team.allMembers ?? team.members ?? [], [team.allMembers, team.members])
  const acceptedMembers = useMemo(() => members.filter(m => m.status === "accepted" || !m.status), [members])
  const pendingInvites = useMemo(() => members.filter(m => m.status === "pending_invite"), [members])
  const pendingRequests = useMemo(() => members.filter(m => m.status === "pending_request"), [members])
  const currentUser = useAuthStore(s => s.user)
  const myPendingInvites = useMemo(() => pendingInvites.filter(m => m.user_id === currentUser?.id || m.user?.id === currentUser?.id), [pendingInvites, currentUser?.id])

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

        <div className="space-y-6">
          {canManage && onInvite && (
            <form onSubmit={handleInvite} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
              <div className="space-y-1">
                <Input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Nom#Tag (ex: Mohamed#247)"
                />
                <p className="text-xs text-muted-foreground">Format : Prénom Nom#tag — ex : Alice Dupont#042</p>
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

          {myPendingInvites.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">Vos invitations</div>
              {myPendingInvites.map((member) => (
                <div
                  key={getMemberKey(member)}
                  className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-xs"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">
                      {team.name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      Invitation reçue
                    </div>
                  </div>
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
                </div>
              ))}
            </div>
          )}

          {canManage && pendingInvites.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">Invitations en attente</div>
              {pendingInvites.map((member) => {
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
                        Invitation envoyée
                      </div>
                    </div>
                    {canManage && onCancelInvite && memberId != null && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => void onCancelInvite(team.id, memberId)}
                        className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        Annuler
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {pendingRequests.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">Demandes en attente</div>
              {pendingRequests.map((member) => {
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
                        Demande reçue
                      </div>
                    </div>
                    {canManage && (
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
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {acceptedMembers.length ? (
            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">Membres ({acceptedMembers.length})</div>
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

                    {canManage && (
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
                    )}
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
