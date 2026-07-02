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
import type { Task } from "@/types/task"
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
    <Card className="bg-card border-border">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cn("border-0", priorityBadgeClass(task.priority))}>
            {priorityLabel(task.priority)}
          </Badge>
          <Badge className={cn("border-0", statusBadgeClass(task.status))}>
            {statusLabel(task.status)}
          </Badge>
        </div>
        <CardTitle className="text-base text-foreground">{task.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {task.description ? (
          <div className="text-sm text-muted-foreground">{task.description}</div>
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

        <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
            <span className="text-muted-foreground">Deadline</span>
            <span className="text-foreground">{deadline ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
            <span className="text-muted-foreground">Projet</span>
            <span className="truncate text-foreground">
              {task.project ? task.project : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
            <span className="text-muted-foreground">Assigné à</span>
            <span className="truncate text-foreground">{assignee ?? "—"}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="justify-between border-t bg-muted/30">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenDetails(task)}
          >
            Détails
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onEdit(task)}
          >
            Modifier
          </Button>
          <Button
            type="button"
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer la tâche</DialogTitle>
              <DialogDescription>
                Cette action est irréversible. Voulez-vous supprimer "{task.title}" ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                >
                  Annuler
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDelete(task.id)
                  }}
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
