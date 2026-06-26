import { useMemo, useState } from "react"
import { LayoutGrid, LayoutList, Plus } from "lucide-react"

import { TaskBoard } from "@/components/tasks/TaskBoard"
import { TaskDetailsPanel } from "@/components/tasks/TaskDetailsPanel"
import { TaskFilters } from "@/components/tasks/TaskFilters"
import type {
  TaskPriorityFilter,
  TaskStatusFilter,
} from "@/components/tasks/TaskFilters"
import { TaskForm } from "@/components/tasks/TaskForm"
import { TaskList } from "@/components/tasks/TaskList"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Task, TaskTag, TaskUpsertPayload } from "@/types/task"
import { useProjects, type DataScope } from "@/hooks/useProjects"
import { useTasks } from "@/hooks/useTasks"
import { useTeams } from "@/hooks/useTeams"
import { useUsers } from "@/hooks/useUsers"
import type { ApiValidationErrors } from "@/services/apiErrors"
import { getValidationErrors } from "@/services/apiErrors"
import { useAuthStore } from "@/stores/authStore"

type TasksProps = {
  scope?: DataScope
}

export default function Tasks({ scope }: TasksProps) {
  const {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    assignTask,
    replaceTask,
  } = useTasks(scope)
  const { projects } = useProjects(scope === "all" ? "all" : undefined)
  const { teams } = useTeams()
  const { users } = useUsers()
  const currentUser = useAuthStore((state) => state.user)

  const [filters, setFilters] = useState<{
    status: TaskStatusFilter
    priority: TaskPriorityFilter
  }>({ status: "toutes", priority: "toutes" })

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createErrors, setCreateErrors] = useState<ApiValidationErrors | null>(null)
  const [editErrors, setEditErrors] = useState<ApiValidationErrors | null>(null)
  const [view, setView] = useState<"list" | "board">("list")

  const remainingCount = useMemo(() => {
    return tasks.filter((t) => t.status !== "done").length
  }, [tasks])

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const okStatus = filters.status === "toutes" ? true : t.status === filters.status
      const okPriority =
        filters.priority === "toutes" ? true : t.priority === filters.priority
      return okStatus && okPriority
    })
  }, [filters.priority, filters.status, tasks])

  const mentionUsers = useMemo(() => {
    return users.map((user) => ({
      id: String(user.id),
      label: user.tag ? `${user.name}#${user.tag}` : user.name,
    }))
  }, [users])

  const assignableUsers = useMemo(() => {
    if (!selectedTask) return []

    const map = new Map<string, { id: string; label: string }>()

    if (currentUser?.id != null && (currentUser.name || currentUser.email)) {
      const label = currentUser.name || currentUser.email || "Moi"
      map.set(String(currentUser.id), { id: String(currentUser.id), label })
    }

    const project = projects.find((p) => String(p.id) === String(selectedTask.project_id))
    const team = project?.team_id
      ? teams.find((t) => String(t.id) === String(project.team_id))
      : null

    for (const member of team?.allMembers ?? []) {
      if (member.status !== 'accepted') continue
      const id = member.user?.id ?? member.user_id
      const label = member.user?.name || member.user?.email || member.name || member.email
      if (id != null && label) {
        map.set(String(id), { id: String(id), label })
      }
    }

    return Array.from(map.values())
  }, [currentUser?.email, currentUser?.id, currentUser?.name, projects, selectedTask, teams])

  function syncTaskTags(taskId: Task["id"], tags: TaskTag[]) {
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return
    const nextTask = { ...task, tags }
    replaceTask(nextTask)
    setSelectedTask((prev) => (prev && prev.id === taskId ? nextTask : prev))
  }

  async function handleAssign(taskId: Task["id"], userId: string | number) {
    const updated = await assignTask(taskId, userId)
    if (updated) {
      replaceTask(updated)
      setSelectedTask((prev) => (prev && prev.id === taskId ? updated : prev))
    }
  }

  async function handleCreate(payload: TaskUpsertPayload) {
    setIsSubmitting(true)
    setCreateErrors(null)
    try {
      await createTask(payload)
      setIsCreateOpen(false)
    } catch (err: unknown) {
      setCreateErrors(getValidationErrors(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdate(payload: TaskUpsertPayload) {
    if (!editingTask) return
    setIsSubmitting(true)
    setEditErrors(null)
    try {
      await updateTask(editingTask.id, payload)
      setEditingTask(null)
    } catch (err: unknown) {
      setEditErrors(getValidationErrors(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleMoveTask(task: Task, status: Task["status"]) {
    const updated = await updateTask(task.id, { status })

    if (updated) {
      replaceTask(updated)
      setSelectedTask((prev) => (prev && prev.id === task.id ? updated : prev))
    }
  }

  return (
    <div className="h-full w-full">
      <div className="page-header">
        <div className="min-w-0">
          <div className="page-title">
            {scope === "all"
              ? "Toutes les tâches"
              : scope === "me"
                ? "Mes tâches"
                : scope === "mine"
                  ? "Mes tâches assignées"
                  : scope === "team"
                    ? "Tâches équipe"
                    : "Tâches"}
          </div>
          <div className="page-subtitle">
            {remainingCount} tâche{remainingCount > 1 ? "s" : ""} restante
            {remainingCount > 1 ? "s" : ""}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-md border bg-card p-1 shadow-xs">
            <Button
              type="button"
              variant={view === "list" ? "secondary" : "ghost"}
              size="xs"
              onClick={() => setView("list")}
            >
              <LayoutList className="size-4" />
              Liste
            </Button>
            <Button
              type="button"
              variant={view === "board" ? "secondary" : "ghost"}
              size="xs"
              onClick={() => setView("board")}
            >
              <LayoutGrid className="size-4" />
              Board
            </Button>
          </div>

          <Dialog
            open={isCreateOpen}
            onOpenChange={(open) => {
              setIsCreateOpen(open)
              if (open) setCreateErrors(null)
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Nouvelle tâche
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nouvelle tâche</DialogTitle>
              </DialogHeader>
              <TaskForm
                projects={projects}
                isSubmitting={isSubmitting}
                errors={createErrors}
                onCancel={() => setIsCreateOpen(false)}
                onSubmit={handleCreate}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="page-section space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{tasks.length} total</Badge>
          <Badge variant="outline">{remainingCount} restantes</Badge>
        </div>

        <TaskFilters value={filters} onChange={setFilters} />

        {error ? (
          <div className="panel-muted text-destructive">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="empty-state">
            Chargement...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            {scope === 'mine' ? 'Aucune tâche ne vous est assignée pour le moment.' : 'Aucune tâche trouvée.'}
          </div>
        ) : view === "board" ? (
          <TaskBoard
            tasks={filteredTasks}
            onMove={(task, status) => void handleMoveTask(task, status)}
            onToggle={(id) => void toggleTask(id)}
            onDelete={(id) => void deleteTask(id)}
            onEdit={(task) => setEditingTask(task)}
            onOpenDetails={(task) => setSelectedTask(task)}
          />
        ) : (
          <TaskList
            tasks={filteredTasks}
            onToggle={(id) => void toggleTask(id)}
            onDelete={(id) => void deleteTask(id)}
            onEdit={(task) => setEditingTask(task)}
            onOpenDetails={(task) => setSelectedTask(task)}
          />
        )}

        <Dialog
          open={!!editingTask}
          onOpenChange={(open) => {
            if (!open) setEditingTask(null)
            if (open) setEditErrors(null)
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Modifier la tâche</DialogTitle>
            </DialogHeader>
            <TaskForm
              projects={projects}
              initialTask={editingTask}
              isSubmitting={isSubmitting}
              errors={editErrors}
              onCancel={() => setEditingTask(null)}
              onSubmit={handleUpdate}
            />
          </DialogContent>
        </Dialog>
      </div>

      <TaskDetailsPanel
        task={selectedTask}
        open={!!selectedTask}
        mentionUsers={mentionUsers}
        assignableUsers={assignableUsers}
        onAssign={handleAssign}
        onClose={() => setSelectedTask(null)}
        onTagsChange={syncTaskTags}
      />
    </div>
  )
}
