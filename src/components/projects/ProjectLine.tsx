import { format, isValid, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { FolderKanban, MoreHorizontal } from "lucide-react"

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
  const teamName = getProjectTeamName(project)
  const { done, total } = getProjectProgress(project)
  const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="group issue-line border-b border-border last:border-b-0">
      <div className="inline-flex size-6 shrink-0 items-center justify-center rounded bg-muted">
        <FolderKanban className="size-3.5 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{project.name}</div>
        {project.description ? (
          <div className="truncate text-xs text-muted-foreground">{project.description}</div>
        ) : null}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
        <span className="hidden text-xs text-muted-foreground md:inline-block">
          {projectStatusLabel(project.status)}
        </span>
        <span className="hidden w-24 truncate text-xs text-muted-foreground lg:inline-block">
          {teamName}
        </span>
        <span className="hidden w-20 text-right text-xs text-muted-foreground sm:inline-block">
          {formatDeadline(project.deadline)}
        </span>
        <div className="flex w-16 items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{progressPercent}%</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onEdit(project)}>Modifier</DropdownMenuItem>
            <DropdownMenuSeparator />
            <Dialog>
              <DialogTrigger asChild>
                <DropdownMenuItem variant="destructive" onSelect={(e) => e.preventDefault()}>
                  Supprimer
                </DropdownMenuItem>
              </DialogTrigger>
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
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => onDelete(project.id)}
                    >
                      Supprimer
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
