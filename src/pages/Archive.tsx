import { useState } from "react"
import { Archive as ArchiveIcon, Search, ArchiveRestore } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { ProjectForm } from "@/components/projects/ProjectForm"
import { ProjectLine } from "@/components/projects/ProjectLine"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const { projects, isLoading, error, updateProject, deleteProject, unarchiveProject } = useArchive()
  const { teams } = useTeams()

  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editErrors, setEditErrors] = useState<ApiValidationErrors | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [unarchivingProject, setUnarchivingProject] = useState<Project | null>(null)
  const [isUnarchiveDialogOpen, setIsUnarchiveDialogOpen] = useState(false)
  const [isUnarchiving, setIsUnarchiving] = useState(false)

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const canEdit = currentUser?.role === "admin"
  const canDelete = currentUser?.role === "admin"
  const canUnarchive = currentUser?.role === "admin"

  async function handleUnarchive() {
    if (!unarchivingProject) return
    setIsUnarchiving(true)
    try {
      await unarchiveProject(unarchivingProject.id)
      setIsUnarchiveDialogOpen(false)
      setUnarchivingProject(null)
    } catch (err) {
      // Error is handled by the hook
    } finally {
      setIsUnarchiving(false)
    }
  }

  function openUnarchiveDialog(project: Project) {
    setUnarchivingProject(project)
    setIsUnarchiveDialogOpen(true)
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{projects.length} total</Badge>
            {currentUser?.role === "admin" && (
              <Badge variant="outline">Mode administrateur</Badge>
            )}
            {currentUser?.role === "responsable" && (
              <Badge variant="outline">Mode responsable</Badge>
            )}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher un projet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
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
        ) : filteredProjects.length ? (
          <div className="list-shell divide-y">
            {filteredProjects.map((project) => (
              <ProjectLine
                key={String(project.id)}
                project={project}
                onEdit={canEdit ? setEditingProject : (() => {})}
                onDelete={canDelete ? (id) => void deleteProject(id) : (() => {})}
                onClick={(project) => navigate(`/archive/${project.id}`)}
                onUnarchive={canUnarchive ? openUnarchiveDialog : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            {searchQuery ? "Aucun projet ne correspond à votre recherche." : "Aucun projet terminé pour le moment."}
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

        <Dialog open={isUnarchiveDialogOpen} onOpenChange={setIsUnarchiveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Désarchiver le projet</DialogTitle>
              <DialogDescription>
                Voulez-vous vraiment désarchiver le projet « {unarchivingProject?.name} » ? Il sera réactivé et apparaîtra à nouveau dans la liste des projets actifs.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUnarchiveDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                disabled={isUnarchiving}
                onClick={handleUnarchive}
              >
                {isUnarchiving ? "Désarchivage..." : "Désarchiver"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
