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
import type { Project } from "@/hooks/useProjects"
import type { Task, TaskPriority, TaskUpsertPayload } from "@/hooks/useTasks"
import type { ApiValidationErrors } from "@/services/apiErrors"

type TaskFormProps = {
  projects: Project[]
  initialTask?: Task | null
  isSubmitting?: boolean
  errors?: ApiValidationErrors | null
  onCancel: () => void
  onSubmit: (payload: TaskUpsertPayload) => Promise<void> | void
}

function parseDeadline(deadline: string | null | undefined) {
  if (!deadline) return undefined
  const parsed = parseISO(deadline)
  return isValid(parsed) ? parsed : undefined
}

export function TaskForm({
  projects,
  initialTask,
  isSubmitting = false,
  errors,
  onCancel,
  onSubmit,
}: TaskFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [deadline, setDeadline] = useState<Date | undefined>(undefined)
  const [projectId, setProjectId] = useState<string>("none")

  useEffect(() => {
    setTitle(initialTask?.title ?? "")
    setDescription(initialTask?.description ?? "")
    setPriority(initialTask?.priority ?? "medium")
    setDeadline(parseDeadline(initialTask?.deadline))
    if (initialTask?.project_id != null) {
      setProjectId(String(initialTask.project_id))
      return
    }
    if (projects.length === 1) {
      setProjectId(String(projects[0]?.id))
      return
    }
    setProjectId("none")
  }, [initialTask, projects])

  const isDisabled = useMemo(() => {
    return (
      isSubmitting ||
      !title.trim() ||
      !priority ||
      projectId === "none" ||
      projects.length === 0
    )
  }, [isSubmitting, priority, projectId, projects.length, title])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      deadline: deadline ? format(deadline, "yyyy-MM-dd") : null,
      project_id: projectId,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="task-title" className="text-xs font-medium text-muted-foreground">
          Titre
        </label>
        <Input
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de la tâche"
        />
        <FieldError errors={errors?.title} />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="task-description"
          className="text-xs font-medium text-muted-foreground"
        >
          Description
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Détails (optionnel)"
          className="min-h-24 w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
        <FieldError errors={errors?.description} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground">Priorité</div>
          <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Choisir une priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Faible</SelectItem>
              <SelectItem value="medium">Moyenne</SelectItem>
              <SelectItem value="high">Haute</SelectItem>
            </SelectContent>
          </Select>
          <FieldError errors={errors?.priority} />
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground">Deadline</div>
          <DatePickerField value={deadline} onChange={setDeadline} />
          <FieldError errors={errors?.deadline} />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="text-xs font-medium text-muted-foreground">Projet</div>
        <Select
          value={projectId}
          onValueChange={setProjectId}
          disabled={projects.length === 0}
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue placeholder={projects.length ? "Choisir un projet" : "Aucun projet"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" disabled>
              Choisir un projet
            </SelectItem>
            {projects.map((project) => (
              <SelectItem key={String(project.id)} value={String(project.id)}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError errors={errors?.project_id} />
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
