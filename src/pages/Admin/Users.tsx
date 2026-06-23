import { useMemo, useState } from "react"
import { format, isValid, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { UserForm } from "@/components/admin/UserForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { AdminUser, AdminUserPayload } from "@/hooks/useAdminUsers"
import { useAdminUsers } from "@/hooks/useAdminUsers"
import type { ApiValidationErrors } from "@/services/apiErrors"
import { getValidationErrors } from "@/services/apiErrors"

function formatDate(value: string | null | undefined) {
  if (!value) return "-"

  const parsed = parseISO(value)
  if (!isValid(parsed)) return "-"

  return format(parsed, "dd/MM/yyyy", { locale: fr })
}

function formatRole(role: AdminUser["role"] | undefined) {
  if (role === "admin") return "Admin"
  if (role === "responsable") return "Responsable"
  return "Utilisateur"
}

function formatGender(gender: AdminUser["gender"] | null | undefined) {
  if (gender === "male") return "Homme"
  if (gender === "female") return "Femme"
  if (gender === "other") return "Autre"
  return "-"
}

export default function AdminUsers() {
  const { users, pagination, isLoading, error, refresh, createUser, updateUser, deleteUser } =
    useAdminUsers()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createErrors, setCreateErrors] = useState<ApiValidationErrors | null>(null)
  const [editErrors, setEditErrors] = useState<ApiValidationErrors | null>(null)

  const pageLabel = useMemo(() => {
    return `Total: ${pagination.total}`
  }, [pagination.total])

  async function handleCreate(payload: AdminUserPayload) {
    setIsSubmitting(true)
    setCreateErrors(null)
    try {
      await createUser(payload)
      setIsCreateOpen(false)
    } catch (err: unknown) {
      setCreateErrors(getValidationErrors(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdate(payload: AdminUserPayload) {
    if (!editingUser) return

    setIsSubmitting(true)
    setEditErrors(null)
    try {
      await updateUser(editingUser.id, payload)
      setEditingUser(null)
    } catch (err: unknown) {
      setEditErrors(getValidationErrors(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(user: AdminUser) {
    const confirmed = window.confirm(
      `Supprimer l'utilisateur "${user.name}" ? Cette action est irréversible.`
    )

    if (!confirmed) return

    setIsSubmitting(true)
    try {
      await deleteUser(user.id)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="h-full">
      <div className="page-header">
        <div>
          <div className="page-title">Administration des utilisateurs</div>
          <div className="page-subtitle">
            {pagination.total} utilisateur{pagination.total > 1 ? "s" : ""}
          </div>
        </div>

        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4" />
          Ajouter un utilisateur
        </Button>
      </div>

      <div className="page-section space-y-5">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{pageLabel}</Badge>
        </div>

        {error ? (
          <div className="panel-muted text-destructive">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-lg border bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y text-sm">
              <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Téléphone</th>
                  <th className="px-4 py-3 font-medium">Genre</th>
                  <th className="px-4 py-3 font-medium">Rôle</th>
                  <th className="px-4 py-3 font-medium">Créé le</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-foreground">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Chargement...
                    </td>
                  </tr>
                ) : users.length ? (
                  users.map((user) => (
                    <tr key={String(user.id)} className="hover:bg-sidebar/40">
                      <td className="px-4 py-3 font-medium">{user.name}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">{user.phone || "-"}</td>
                      <td className="px-4 py-3">{formatGender(user.gender)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={user.role === "admin" ? "secondary" : "outline"}>
                          {formatRole(user.role)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{formatDate(user.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUser(user)}
                            disabled={isSubmitting}
                          >
                            <Pencil className="size-4" />
                            Modifier
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => void handleDelete(user)}
                            disabled={isSubmitting}
                          >
                            <Trash2 className="size-4" />
                            Supprimer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">{pageLabel}</div>

          <Button
            type="button"
            variant="outline"
            onClick={() => void refresh()}
            disabled={isLoading}
          >
            Rafraîchir
          </Button>
        </div>
      </div>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (open) setCreateErrors(null)
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter un utilisateur</DialogTitle>
          </DialogHeader>
          <UserForm
            isSubmitting={isSubmitting}
            errors={createErrors}
            onCancel={() => setIsCreateOpen(false)}
            onSubmit={handleCreate}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null)
          if (open) setEditErrors(null)
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier un utilisateur</DialogTitle>
          </DialogHeader>
          <UserForm
            initialUser={editingUser}
            isSubmitting={isSubmitting}
            errors={editErrors}
            onCancel={() => setEditingUser(null)}
            onSubmit={handleUpdate}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
