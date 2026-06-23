import { format, isValid, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { Pencil, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import type { Project } from "@/types/project"
import {
  getProjectProgress,
  getProjectTeamName,
  projectStatusBadgeClass,
  projectStatusLabel,
} from "@/lib/projects"
import { cn } from "@/lib/utils"

type ProjectCardProps = {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (id: Project["id"]) => void
}

function formatDeadline(deadline: string | null | undefined) {
  if (!deadline) return null
  const parsed = parseISO(deadline)
  if (!isValid(parsed)) return null
  return format(parsed, "dd MMM yyyy", { locale: fr })
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const navigate = useNavigate()
  const deadline = formatDeadline(project.deadline)
  const teamName = getProjectTeamName(project)
  const { done, total } = getProjectProgress(project)
  const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <Card
      className="bg-zinc-950/40 ring-zinc-800 cursor-pointer transition-colors hover:bg-zinc-950/60"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cn("border-0", projectStatusBadgeClass(project.status))}>
            {projectStatusLabel(project.status)}
          </Badge>
        </div>
        <CardTitle className="text-base text-zinc-100">{project.name}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="text-sm text-zinc-300">
          {project.description || "Aucune description"}
        </div>

        <div className="grid grid-cols-1 gap-2 text-xs text-zinc-400 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
            <span className="text-zinc-500">Deadline</span>
            <span className="text-zinc-200">{deadline ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
            <span className="text-zinc-500">Équipe</span>
            <span className="truncate text-zinc-200">{teamName}</span>
          </div>
        </div>

        <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Progression</span>
            <span className="text-zinc-200">
              {done}/{total} tâche{total > 1 ? "s" : ""} terminée{done > 1 ? "s" : ""}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="justify-between border-zinc-800 bg-zinc-950/40">
        <Button
          type="button"
          variant="outline"
          className="border-zinc-800 bg-zinc-950/40 text-zinc-100 hover:bg-zinc-900"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(project)
          }}
        >
          <Pencil />
          Modifier
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="destructive"
              className="bg-destructive/15 text-destructive hover:bg-destructive/25"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 />
              Supprimer
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 text-zinc-100 ring-zinc-800">
            <DialogHeader>
              <DialogTitle>Supprimer le projet</DialogTitle>
              <DialogDescription>
                Cette action est irréversible. Voulez-vous supprimer « {project.name} » ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="border-zinc-800 bg-zinc-950/40 text-zinc-100 hover:bg-zinc-900"
                >
                  Annuler
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="destructive"
                  className="bg-destructive/15 text-destructive hover:bg-destructive/25"
                  onClick={() => onDelete(project.id)}
                >
                  Supprimer
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}
