import { useState } from "react"
import { Plus } from "lucide-react"

import { ProjectCard } from "@/components/projects/ProjectCard"
import { ProjectForm } from "@/components/projects/ProjectForm"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Project, ProjectPayload } from "@/hooks/useProjects"
import { useProjects } from "@/hooks/useProjects"
import { useTeams } from "@/hooks/useTeams"
import type { ApiValidationErrors } from "@/services/apiErrors"
import { getValidationErrors } from "@/services/apiErrors"

export default function Projects() {
  const { projects, isLoading, error, createProject, updateProject, deleteProject } =
    useProjects()
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
    <div className="h-full rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium text-zinc-100">Projets</div>
            <div className="text-xs text-zinc-400">
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
              <Button className="bg-zinc-100 text-zinc-950 hover:bg-zinc-100/90">
                <Plus />
                Nouveau projet
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-zinc-900 text-zinc-100 ring-zinc-800">
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

        {error ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-200">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6 text-sm text-zinc-300">
            Chargement...
          </div>
        ) : projects.length ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard
                key={String(project.id)}
                project={project}
                onEdit={setEditingProject}
                onDelete={(id) => void deleteProject(id)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6 text-sm text-zinc-300">
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
          <DialogContent className="max-w-lg bg-zinc-900 text-zinc-100 ring-zinc-800">
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
