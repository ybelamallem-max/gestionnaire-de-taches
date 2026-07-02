import { useMemo, useState } from "react"
import { LayoutGrid, LayoutList, Plus, Search, Circle, Clock, CircleCheck } from "lucide-react"

import { TaskBoard } from "@/components/tasks/TaskBoard"
import { TaskDetailsPanel } from "@/components/tasks/TaskDetailsPanel"
import { TaskFilters } from "@/components/tasks/TaskFilters"
import type {
  TaskPriorityFilter,
  TaskStatusFilter,
} from "@/components/tasks/TaskFilters"
import { TaskForm } from "@/components/tasks/TaskForm"
import { TaskLine } from "@/components/tasks/TaskLine"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  const { projects, refresh: refreshProjects } = useProjects(scope === "all" ? "all" : undefined)
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
  } = useTasks(scope, refreshProjects)
  const { teams } = useTeams()
  const { users } = useUsers()
  const currentUser = useAuthStore((state) => state.user)

  const [filters, setFilters] = useState<{
    status: TaskStatusFilter
    priority: TaskPriorityFilter
  }>({ status: "toutes", priority: "toutes" })

  const [searchQuery, setSearchQuery] = useState("")

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
      const okSearch = searchQuery === "" || 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
      return okStatus && okPriority && okSearch
    })
  }, [filters.priority, filters.status, tasks, searchQuery])

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
      <div className="px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              {scope === "all"
                ? "Toutes les tâches"
                : scope === "me"
                  ? "Mes tâches"
                  : scope === "mine"
                    ? "Mes tâches assignées"
                    : scope === "team"
                      ? "Tâches équipe"
                      : "Tâches"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {remainingCount} tâche{remainingCount > 1 ? "s" : ""} restante
              {remainingCount > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border bg-card p-1 shadow-sm">
              <Button
                type="button"
                variant={view === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("list")}
              >
                <LayoutList className="size-4" />
                Liste
              </Button>
              <Button
                type="button"
                variant={view === "board" ? "secondary" : "ghost"}
                size="sm"
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

        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{tasks.length} total</Badge>
              <Badge variant="outline">{remainingCount} restantes</Badge>
            </div>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une tâche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
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
            <div className="space-y-4">
              {["todo", "in_progress", "done"].map((status) => {
                const statusTasks = filteredTasks.filter((t) => t.status === status)
                if (statusTasks.length === 0) return null

                const bgColors = {
                  todo: "bg-slate-50 dark:bg-[#4f545c]/30",
                  in_progress: "bg-amber-50 dark:bg-[#faa61a]/20",
                  done: "bg-emerald-50 dark:bg-[#3ba55c]/20"
                }

                const iconColors = {
                  todo: "text-slate-500 dark:text-[#b9bbbe]",
                  in_progress: "text-amber-600 dark:text-[#faa61a]",
                  done: "text-emerald-600 dark:text-[#3ba55c]"
                }

                const StatusIcon = status === "todo" ? Circle : status === "in_progress" ? Clock : CircleCheck

                return (
                  <div key={status} className="space-y-2">
                    <div className={`flex items-center gap-2 rounded-lg px-4 py-3 ${bgColors[status]}`}>
                      <StatusIcon className={`size-4 ${iconColors[status]}`} />
                      <h3 className="text-sm font-semibold capitalize">
                        {status === "todo" ? "À faire" : status === "in_progress" ? "En cours" : "Terminé"}
                      </h3>
                      <Badge variant="secondary">{statusTasks.length}</Badge>
                    </div>
                    <div className="space-y-1">
                      {statusTasks.map((task) => (
                        <TaskLine
                          key={String(task.id)}
                          task={task}
                          onToggle={(id) => void toggleTask(id)}
                          onDelete={(id) => void deleteTask(id)}
                          onEdit={(task) => setEditingTask(task)}
                          onOpenDetails={(task) => setSelectedTask(task)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
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
