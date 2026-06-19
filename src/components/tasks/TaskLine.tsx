import { format, isValid, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { CircleUserRound, MoreHorizontal } from "lucide-react"

import { PriorityDot } from "@/components/shared/PriorityDot"
import { StatusIcon } from "@/components/shared/StatusIcon"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { cn } from "@/lib/utils"
import type { Task } from "@/types/task"

type TaskLineProps = {
  task: Task
  onToggle: (id: Task["id"]) => void
  onDelete: (id: Task["id"]) => void
  onEdit: (task: Task) => void
  onOpenDetails: (task: Task) => void
  compact?: boolean
}

function formatDeadline(deadline: string | null | undefined) {
  if (!deadline) return null
  const parsed = parseISO(deadline)
  if (!isValid(parsed)) return null
  return format(parsed, "dd MMM", { locale: fr })
}

function getAssigneeInitials(task: Task) {
  const name = task.assignee?.name || task.assignee?.email
  if (!name) return null
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function toggleLabel(status: Task["status"]) {
  if (status === "todo") return "Démarrer"
  if (status === "in_progress") return "Terminer"
  return "Reprendre"
}

export function TaskLine({
  task,
  onToggle,
  onDelete,
  onEdit,
  onOpenDetails,
  compact = false,
}: TaskLineProps) {
  const deadline = formatDeadline(task.deadline)
  const assigneeInitials = getAssigneeInitials(task)

  return (
    <div
      className={cn(
        "group issue-line",
        compact && "h-auto px-3 py-2 sm:px-3"
      )}
      onClick={() => onOpenDetails(task)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onOpenDetails(task)
        }
      }}
      role="button"
      tabIndex={0}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onToggle(task.id)
        }}
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
      >
        <StatusIcon status={task.status} />
      </button>

      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
        {task.title}
      </span>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        {task.project && !compact ? (
          <span className="hidden max-w-[120px] truncate text-xs text-muted-foreground lg:inline-block">
            {task.project}
          </span>
        ) : null}

        <PriorityDot priority={task.priority} />

        {deadline ? (
          <span className="hidden w-14 shrink-0 text-right text-xs text-muted-foreground sm:inline-block">
            {deadline}
          </span>
        ) : (
          <span className="hidden w-14 shrink-0 sm:inline-block" />
        )}

        {assigneeInitials ? (
          <Avatar className="size-6 shrink-0">
            <AvatarFallback className="text-[10px]">{assigneeInitials}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="flex size-6 shrink-0 items-center justify-center">
            <CircleUserRound className="size-4 text-muted-foreground/60" />
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100"
              onClick={(event) => event.stopPropagation()}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation()
                onOpenDetails(task)
              }}
            >
              Détails
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation()
                onEdit(task)
              }}
            >
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation()
                onToggle(task.id)
              }}
            >
              {toggleLabel(task.status)}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <Dialog>
              <DialogTrigger asChild>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={(event) => event.preventDefault()}
                  onClick={(event) => event.stopPropagation()}
                >
                  Supprimer
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Supprimer la tâche</DialogTitle>
                  <DialogDescription>
                    Cette action est irréversible. Voulez-vous supprimer « {task.title} » ?
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
                      onClick={() => onDelete(task.id)}
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
