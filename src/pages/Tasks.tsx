import { useMemo, useState } from "react"
import { Plus } from "lucide-react"

import { TaskDetailsPanel } from "@/components/tasks/TaskDetailsPanel"
import { TaskFilters } from "@/components/tasks/TaskFilters"
import type {
  TaskPriorityFilter,
  TaskStatusFilter,
} from "@/components/tasks/TaskFilters"
import { TaskForm } from "@/components/tasks/TaskForm"
import { TaskList } from "@/components/tasks/TaskList"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Task, TaskTag, TaskUpsertPayload } from "@/hooks/useTasks"
import { useProjects } from "@/hooks/useProjects"
import { useTasks } from "@/hooks/useTasks"
import { useTeams } from "@/hooks/useTeams"
import type { ApiValidationErrors } from "@/services/apiErrors"
import { getValidationErrors } from "@/services/apiErrors"
import { useAuthStore } from "@/stores/authStore"

export default function Tasks() {
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
  } = useTasks()
  const { projects } = useProjects()
  const { teams } = useTeams()
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
    const map = new Map<string, { id: string; label: string }>()

    if (currentUser?.name || currentUser?.email) {
      const label = currentUser.name || currentUser.email || "Moi"
      map.set(String(currentUser.id ?? label), {
        id: String(currentUser.id ?? label),
        label,
      })
    }

    for (const task of tasks) {
      const assignee = task.assignee
      const label = assignee?.name || assignee?.email
      if (label) map.set(String(assignee?.id ?? label), { id: String(assignee?.id ?? label), label })
    }

    return Array.from(map.values())
  }, [currentUser, tasks])

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

    for (const member of team?.members ?? []) {
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

  return (
    <div className="h-full rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-zinc-100">
              Tâches
            </div>
            <div className="truncate text-xs text-zinc-400">
              {remainingCount} tâche{remainingCount > 1 ? "s" : ""} restante
              {remainingCount > 1 ? "s" : ""}
            </div>
          </div>

          <Dialog
            open={isCreateOpen}
            onOpenChange={(open) => {
              setIsCreateOpen(open)
              if (open) setCreateErrors(null)
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-zinc-100 text-zinc-950 hover:bg-zinc-100/90">
                <Plus />
                Nouvelle tâche
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-zinc-900 text-zinc-100 ring-zinc-800">
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

        <TaskFilters value={filters} onChange={setFilters} />

        {error ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-200">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6 text-sm text-zinc-300">
            Chargement...
          </div>
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
          <DialogContent className="max-w-lg bg-zinc-900 text-zinc-100 ring-zinc-800">
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
