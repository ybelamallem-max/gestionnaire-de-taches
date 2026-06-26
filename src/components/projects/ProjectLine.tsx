import { format, isValid, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { FolderKanban, MoreHorizontal } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
}

function formatDeadline(deadline: string | null | undefined) {
  if (!deadline) return "—"
  const parsed = parseISO(deadline)
  if (!isValid(parsed)) return "—"
  return format(parsed, "dd MMM yyyy", { locale: fr })
}

export function ProjectLine({ project, onEdit, onDelete }: ProjectLineProps) {
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

  function handleLineClick(e: React.MouseEvent) {
    if (isMenuOpen || isDeleteDialogOpen) {
      e.stopPropagation()
      return
    }
    navigate(`/projects/${project.id}`)
  }

  return (
    <>
      <div
        className="group issue-line border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/50"
        onClick={handleLineClick}
      >
      <div className="inline-flex size-6 shrink-0 items-center justify-center rounded bg-muted/50">
        <FolderKanban className="size-3.5 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{project.name}</div>
        {(project.team_id === null || project.team === null) && (
          <Badge variant="outline" className="text-xs">Personnel</Badge>
        )}
        {project.description ? (
          <div className="truncate text-xs text-muted-foreground">{project.description}</div>
        ) : null}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
        <span className="hidden text-xs text-muted-foreground md:inline-block">
          {projectStatusLabel(project.status)}
        </span>
        <span className="hidden w-24 truncate text-xs text-muted-foreground lg:inline-block">
          {displayName}
        </span>
        <span className="hidden w-20 text-right text-xs text-muted-foreground sm:inline-block">
          {formatDeadline(project.deadline)}
        </span>
        <div className="flex w-16 items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground/80 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{progressPercent}%</span>
        </div>

        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
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
    </div>

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
