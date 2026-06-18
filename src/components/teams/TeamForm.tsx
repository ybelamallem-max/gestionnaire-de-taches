import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field-error"
import { Input } from "@/components/ui/input"
import type { Team, TeamPayload } from "@/hooks/useTeams"
import type { ApiValidationErrors } from "@/services/apiErrors"

type TeamFormProps = {
  initialTeam?: Team | null
  isSubmitting?: boolean
  errors?: ApiValidationErrors | null
  onCancel: () => void
  onSubmit: (payload: TeamPayload) => Promise<void> | void
}

export function TeamForm({
  initialTeam,
  isSubmitting = false,
  errors,
  onCancel,
  onSubmit,
}: TeamFormProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    setName(initialTeam?.name ?? "")
    setDescription(initialTeam?.description ?? "")
  }, [initialTeam])

  const isDisabled = useMemo(() => isSubmitting || !name.trim(), [isSubmitting, name])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="team-name" className="text-xs font-medium text-zinc-300">
          Nom
        </label>
        <Input
          id="team-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de l'équipe"
          className="h-10 border-zinc-800 bg-zinc-950/40 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-700/40"
        />
        <FieldError errors={errors?.name} />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="team-description"
          className="text-xs font-medium text-zinc-300"
        >
          Description
        </label>
        <textarea
          id="team-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optionnel)"
          className="min-h-24 w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus-visible:ring-2 focus-visible:ring-zinc-700/40"
        />
        <FieldError errors={errors?.description} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="border-zinc-800 bg-zinc-950/40 text-zinc-100 hover:bg-zinc-900"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isDisabled}
          className="bg-zinc-100 text-zinc-950 hover:bg-zinc-100/90"
        >
          {isSubmitting ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  )
}
