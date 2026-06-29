import { useState } from "react"
import { Archive as ArchiveIcon } from "lucide-react"

import { ProjectForm } from "@/components/projects/ProjectForm"
import { ProjectLine } from "@/components/projects/ProjectLine"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Project, ProjectPayload } from "@/types/project"
import type { ApiValidationErrors } from "@/services/apiErrors"
import { getValidationErrors } from "@/services/apiErrors"
import { useArchive } from "@/hooks/useArchive"
import { useTeams } from "@/hooks/useTeams"
import { useAuthStore } from "@/stores/authStore"

export default function Archive() {
  const currentUser = useAuthStore((s) => s.user)
  const { projects, isLoading, error, updateProject, deleteProject } = useArchive()
  const { teams } = useTeams()

  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editErrors, setEditErrors] = useState<ApiValidationErrors | null>(null)

  const canEdit = currentUser?.role === "admin"
  const canDelete = currentUser?.role === "admin"

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
          <div className="page-title flex items-center gap-2">
            <ArchiveIcon />
            Archive
          </div>
          <div className="page-subtitle">
            {projects.length} projet{projects.length > 1 ? "s" : ""} terminé{projects.length > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="page-section space-y-5">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{projects.length} total</Badge>
          {currentUser?.role === "admin" && (
            <Badge variant="outline">Mode administrateur</Badge>
          )}
          {currentUser?.role === "responsable" && (
            <Badge variant="outline">Mode responsable</Badge>
          )}
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
                onEdit={canEdit ? setEditingProject : (() => {})}
                onDelete={canDelete ? (id) => void deleteProject(id) : (() => {})}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            Aucun projet terminé pour le moment.
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
