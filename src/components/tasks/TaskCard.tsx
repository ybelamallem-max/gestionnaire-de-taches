import { format, isValid, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { Trash2 } from "lucide-react"

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
import type { Task } from "@/hooks/useTasks"
import {
  priorityBadgeClass,
  priorityLabel,
  statusBadgeClass,
  statusLabel,
  tagStyle,
} from "@/lib/tasks"
import { cn } from "@/lib/utils"

type TaskCardProps = {
  task: Task
  onToggle: (id: Task["id"]) => void
  onDelete: (id: Task["id"]) => void
  onEdit: (task: Task) => void
  onOpenDetails: (task: Task) => void
}

function formatDeadline(deadline: string | null | undefined) {
  if (!deadline) return null
  const parsed = parseISO(deadline)
  if (!isValid(parsed)) return null
  return format(parsed, "dd MMM yyyy", { locale: fr })
}

function getAssigneeLabel(task: Task) {
  const raw = task.assignee
  if (raw?.name) return raw.name
  if (raw?.email) return raw.email
  return null
}

function toggleLabel(status: Task["status"]) {
  if (status === "todo") return "Démarrer"
  if (status === "in_progress") return "Terminer"
  return "Reprendre"
}

export function TaskCard({
  task,
  onToggle,
  onDelete,
  onEdit,
  onOpenDetails,
}: TaskCardProps) {
  const deadline = formatDeadline(task.deadline)
  const assignee = getAssigneeLabel(task)

  return (
    <Card className="bg-zinc-950/40 ring-zinc-800">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cn("border-0", priorityBadgeClass(task.priority))}>
            {priorityLabel(task.priority)}
          </Badge>
          <Badge className={cn("border-0", statusBadgeClass(task.status))}>
            {statusLabel(task.status)}
          </Badge>
        </div>
        <CardTitle className="text-base text-zinc-100">{task.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {task.description ? (
          <div className="text-sm text-zinc-300">{task.description}</div>
        ) : null}

        {task.tags?.length ? (
          <div className="flex flex-wrap gap-2">
            {task.tags.map((tag) => (
              <Badge
                key={String(tag.id)}
                className="border text-xs"
                style={tagStyle(tag)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-2 text-xs text-zinc-400 sm:grid-cols-3">
          <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
            <span className="text-zinc-500">Deadline</span>
            <span className="text-zinc-200">{deadline ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
            <span className="text-zinc-500">Projet</span>
            <span className="truncate text-zinc-200">
              {task.project ? task.project : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
            <span className="text-zinc-500">Assigné à</span>
            <span className="truncate text-zinc-200">{assignee ?? "—"}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="justify-between border-zinc-800 bg-zinc-950/40">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-zinc-800 bg-zinc-950/40 text-zinc-100 hover:bg-zinc-900"
            onClick={() => onOpenDetails(task)}
          >
            Détails
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-zinc-800 bg-zinc-950/40 text-zinc-100 hover:bg-zinc-900"
            onClick={() => onEdit(task)}
          >
            Modifier
          </Button>
          <Button
            type="button"
            className="bg-zinc-100 text-zinc-950 hover:bg-zinc-100/90"
            onClick={() => onToggle(task.id)}
          >
            {toggleLabel(task.status)}
          </Button>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="destructive"
              className="bg-destructive/15 text-destructive hover:bg-destructive/25"
            >
              <Trash2 />
              Supprimer
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 text-zinc-100 ring-zinc-800">
            <DialogHeader>
              <DialogTitle>Supprimer la tâche</DialogTitle>
              <DialogDescription>
                Cette action est irréversible. Voulez-vous supprimer “{task.title}” ?
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
                  onClick={() => onDelete(task.id)}
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
