import { useMemo, useState } from "react"
import { format, isValid, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { UserForm } from "@/components/admin/UserForm"
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
  return role === "admin" ? "Admin" : "Utilisateur"
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
    <div className="h-full rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium text-zinc-100">Administration des utilisateurs</div>
            <div className="text-xs text-zinc-400">
              {pagination.total} utilisateur{pagination.total > 1 ? "s" : ""}
            </div>
          </div>

          <Button
            className="bg-zinc-100 text-zinc-950 hover:bg-zinc-100/90"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus />
            Ajouter un utilisateur
          </Button>
        </div>

        {error ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-200">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/40">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800 text-sm">
              <thead className="bg-zinc-950/80 text-left text-xs uppercase tracking-wide text-zinc-400">
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
              <tbody className="divide-y divide-zinc-800 text-zinc-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                      Chargement...
                    </td>
                  </tr>
                ) : users.length ? (
                  users.map((user) => (
                    <tr key={String(user.id)} className="hover:bg-zinc-900/50">
                      <td className="px-4 py-3 font-medium text-zinc-100">{user.name}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">{user.phone || "-"}</td>
                      <td className="px-4 py-3">{formatGender(user.gender)}</td>
                      <td className="px-4 py-3">{formatRole(user.role)}</td>
                      <td className="px-4 py-3">{formatDate(user.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-zinc-800 bg-zinc-950/40 text-zinc-100 hover:bg-zinc-900"
                            onClick={() => setEditingUser(user)}
                            disabled={isSubmitting}
                          >
                            <Pencil className="size-4" />
                            Modifier
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-zinc-800 bg-zinc-950/40 text-zinc-100 hover:bg-zinc-900"
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
                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-zinc-400">{pageLabel}</div>

          <Button
            type="button"
            variant="outline"
            className="border-zinc-800 bg-zinc-950/40 text-zinc-100 hover:bg-zinc-900"
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
        <DialogContent className="max-w-2xl bg-zinc-900 text-zinc-100 ring-zinc-800">
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
        <DialogContent className="max-w-2xl bg-zinc-900 text-zinc-100 ring-zinc-800">
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
