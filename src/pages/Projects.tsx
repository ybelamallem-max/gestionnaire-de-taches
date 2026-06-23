import { useState } from "react"
import { Plus } from "lucide-react"

import { ProjectForm } from "@/components/projects/ProjectForm"
import { ProjectLine } from "@/components/projects/ProjectLine"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Project, ProjectPayload } from "@/types/project"
import type { DataScope } from "@/hooks/useProjects"
import { useProjects } from "@/hooks/useProjects"
import { useTeams } from "@/hooks/useTeams"
import type { ApiValidationErrors } from "@/services/apiErrors"
import { getValidationErrors } from "@/services/apiErrors"

type ProjectsProps = {
  scope?: DataScope
}

export default function Projects({ scope }: ProjectsProps) {
  const { projects, isLoading, error, createProject, updateProject, deleteProject } =
    useProjects(scope)
  const { teams } = useTeams()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createErrors, setCreateErrors] = useState<ApiValidationErrors | null>(null)
  const [editErrors, setEditErrors] = useState<ApiValidationErrors | null>(null)

  async function handleCreate(payload: ProjectPayload) {
    setIsSubmitting(true)
    setCreateErrors(null)
    try {
      await createProject(payload)
      setIsCreateOpen(false)
    } catch (err: unknown) {
      setCreateErrors(getValidationErrors(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdate(payload: ProjectPayload) {
    if (!editingProject) return
    setIsSubmitting(true)
    setEditErrors(null)
    try {
      await updateProject(editingProject.id, payload)
      setEditingProject(null)
    } catch (err: unknown) {
      setEditErrors(getValidationErrors(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="h-full">
      <div className="page-header">
        <div>
          <div className="page-title">
            {scope === "all"
              ? "Tous les projets"
              : scope === "me"
                ? "Mes projets"
                : scope === "team"
                  ? "Projets équipe"
                  : "Projets"}
          </div>
          <div className="page-subtitle">
            {projects.length} projet{projects.length > 1 ? "s" : ""}
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
              Nouveau projet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouveau projet</DialogTitle>
            </DialogHeader>
            <ProjectForm
              teams={teams}
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
          <Badge variant="secondary">{projects.length} total</Badge>
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
        ) : projects.length ? (
          <div className="list-shell divide-y">
            {projects.map((project) => (
              <ProjectLine
                key={String(project.id)}
                project={project}
                onEdit={setEditingProject}
                onDelete={(id) => void deleteProject(id)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            Aucun projet pour le moment.
          </div>
        )}

        <Dialog
          open={!!editingProject}
          onOpenChange={(open) => {
            if (!open) setEditingProject(null)
            if (open) setEditErrors(null)
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Modifier le projet</DialogTitle>
            </DialogHeader>
            <ProjectForm
              teams={teams}
              initialProject={editingProject}
              isSubmitting={isSubmitting}
              errors={editErrors}
              onCancel={() => setEditingProject(null)}
              onSubmit={handleUpdate}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
