import { format, isValid, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { FolderKanban, MoreHorizontal, ArchiveRestore } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProjectStatusIcon } from "@/components/projects/ProjectStatusIcon"
import type { Project } from "@/types/project"
import {
  getProjectProgress,
  getProjectTeamName,
  getProjectOwnerName,
  projectStatusLabel,
} from "@/lib/projects"

type ProjectLineProps = {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (id: Project["id"]) => void
  onClick?: (project: Project) => void
  onUnarchive?: (project: Project) => void
}

function formatDeadline(deadline: string | null | undefined) {
  if (!deadline) return "—"
  const parsed = parseISO(deadline)
  if (!isValid(parsed)) return "—"
  return format(parsed, "dd MMM yyyy", { locale: fr })
}

export function ProjectLine({ project, onEdit, onDelete, onClick, onUnarchive }: ProjectLineProps) {
  const navigate = useNavigate()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const teamName = getProjectTeamName(project)
  const ownerName = getProjectOwnerName(project)
  const displayName = (project.team_id === null || project.team === null) ? ownerName : teamName
  const { done, total } = getProjectProgress(project)
  const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0

  function handleDelete() {
    onDelete(project.id)
    setIsDeleteDialogOpen(false)
  }

  function handleCardClick(e: React.MouseEvent) {
    if (isMenuOpen || isDeleteDialogOpen) {
      e.stopPropagation()
      return
    }
    if (onClick) {
      onClick(project)
    } else {
      navigate(`/projects/${project.id}`)
    }
  }

  return (
    <>
      <Card
        className="overflow-hidden cursor-pointer transition-shadow hover:shadow-md"
        onClick={handleCardClick}
      >
        <CardContent className="p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <FolderKanban className="size-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold">{project.name}</div>
                    {(project.team_id === null || project.team === null) && (
                      <Badge variant="outline" className="text-xs">Personnel</Badge>
                    )}
                  </div>
                  {project.description ? (
                    <div className="mt-1 truncate text-xs text-muted-foreground">{project.description}</div>
                  ) : null}
                </div>
              </div>

              <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onUnarchive && (
                    <>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        onUnarchive(project)
                      }}>
                        <ArchiveRestore className="mr-2 size-4" />
                        Désarchiver
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    onEdit(project)
                  }}>Modifier</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsDeleteDialogOpen(true)
                    }}
                  >
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <ProjectStatusIcon status={project.status} />
                  <span>{projectStatusLabel(project.status)}</span>
                </div>
                <span>•</span>
                <span className="truncate">{displayName}</span>
                <span>•</span>
                <span>{formatDeadline(project.deadline)}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-xs font-medium">{progressPercent}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer le projet</DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Voulez-vous supprimer « {project.name} » ?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
          >
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
