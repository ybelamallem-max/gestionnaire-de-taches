import { useEffect, useMemo, useState } from "react"
import { format, isValid, parseISO } from "date-fns"

import { Button } from "@/components/ui/button"
import { DatePickerField } from "@/components/ui/date-picker-field"
import { FieldError } from "@/components/ui/field-error"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Project, ProjectPayload, ProjectStatus } from "@/hooks/useProjects"
import type { Team } from "@/hooks/useTeams"
import type { ApiValidationErrors } from "@/services/apiErrors"

type ProjectFormProps = {
  teams: Team[]
  initialProject?: Project | null
  isSubmitting?: boolean
  errors?: ApiValidationErrors | null
  onCancel: () => void
  onSubmit: (payload: ProjectPayload) => Promise<void> | void
}

function parseDeadline(deadline: string | null | undefined) {
  if (!deadline) return undefined
  const parsed = parseISO(deadline)
  return isValid(parsed) ? parsed : undefined
}

function getInitialTeamId(project: Project | null | undefined) {
  if (!project) return "none"
  if (project.team_id != null) return String(project.team_id)
  if (typeof project.team === "object" && project.team?.id != null) return String(project.team.id)
  return "none"
}

export function ProjectForm({
  teams,
  initialProject,
  isSubmitting = false,
  errors,
  onCancel,
  onSubmit,
}: ProjectFormProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<ProjectStatus>("active")
  const [deadline, setDeadline] = useState<Date | undefined>(undefined)
  const [teamId, setTeamId] = useState("none")

  useEffect(() => {
    setName(initialProject?.name ?? "")
    setDescription(initialProject?.description ?? "")
    setStatus(initialProject?.status ?? "active")
    setDeadline(parseDeadline(initialProject?.deadline))
    setTeamId(getInitialTeamId(initialProject))
  }, [initialProject])

  const isDisabled = useMemo(
    () => isSubmitting || !name.trim() || teamId === "none",
    [isSubmitting, name, teamId]
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      status,
      deadline: deadline ? format(deadline, "yyyy-MM-dd") : null,
      team_id: teamId,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="project-name" className="text-xs font-medium text-muted-foreground">
          Nom
        </label>
        <Input
          id="project-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom du projet"
        />
        <FieldError errors={errors?.name} />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="project-description"
          className="text-xs font-medium text-muted-foreground"
        >
          Description
        </label>
        <textarea
          id="project-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optionnel)"
          className="min-h-24 w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
        <FieldError errors={errors?.description} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground">Statut</div>
          <Select value={status} onValueChange={(value) => setStatus(value as ProjectStatus)}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
              <SelectItem value="archived">Archivé</SelectItem>
            </SelectContent>
          </Select>
          <FieldError errors={errors?.status} />
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground">Deadline</div>
          <DatePickerField value={deadline} onChange={setDeadline} />
          <FieldError errors={errors?.deadline} />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="text-xs font-medium text-muted-foreground">Équipe</div>
        <Select value={teamId} onValueChange={setTeamId}>
          <SelectTrigger className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" disabled>
              Choisir une équipe
            </SelectItem>
            {teams.map((team) => (
              <SelectItem key={String(team.id)} value={String(team.id)}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError errors={errors?.team_id} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isDisabled}
        >
          {isSubmitting ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  )
}
