import { useMemo, useState } from "react"
import { ArrowLeft, LayoutGrid, LayoutList, Plus } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"

import { TaskBoard } from "@/components/tasks/TaskBoard"
import { TaskDetailsPanel } from "@/components/tasks/TaskDetailsPanel"
import { TaskFilters } from "@/components/tasks/TaskFilters"
import type {
  TaskPriorityFilter,
  TaskStatusFilter,
} from "@/components/tasks/TaskFilters"
import { TaskForm } from "@/components/tasks/TaskForm"
import { TaskList } from "@/components/tasks/TaskList"
import { ProjectForm } from "@/components/projects/ProjectForm"
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
import type { Project, ProjectPayload } from "@/types/project"
import { useProjects } from "@/hooks/useProjects"
import { useTasks } from "@/hooks/useTasks"
import { useTeams } from "@/hooks/useTeams"
import { useUsers } from "@/hooks/useUsers"
import { canViewAll } from "@/lib/roles"
import { useAuthStore } from "@/stores/authStore"
import type { ApiValidationErrors } from "@/services/apiErrors"
import { getValidationErrors } from "@/services/apiErrors"
import {
  getProjectProgress,
  getProjectTeamName,
  getProjectOwnerName,
  projectStatusBadgeClass,
  projectStatusLabel,
} from "@/lib/projects"
import { cn } from "@/lib/utils"

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const dataScope = canViewAll(currentUser?.role) ? "all" : undefined
  const { projects, isLoading: projectsLoading, updateProject, refresh: refreshProjects } = useProjects(dataScope)
  const { tasks, createTask, updateTask, deleteTask, toggleTask, assignTask, replaceTask } = useTasks(dataScope, refreshProjects)
  const { teams } = useTeams()
  const { users } = useUsers()

  const project = useMemo(() => {
    if (!id) return null
    return projects.find((p) => String(p.id) === id) || null
  }, [id, projects])

  const projectTasks = useMemo(() => {
    if (!project) return []
    return tasks.filter((t) => String(t.project_id) === String(project.id))
  }, [project, tasks])

  const [filters, setFilters] = useState<{
    status: TaskStatusFilter
    priority: TaskPriorityFilter
  }>({ status: "toutes", priority: "toutes" })

  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createErrors, setCreateErrors] = useState<ApiValidationErrors | null>(null)
  const [editErrors, setEditErrors] = useState<ApiValidationErrors | null>(null)
  const [editProjectErrors, setEditProjectErrors] = useState<ApiValidationErrors | null>(null)
  const [view, setView] = useState<"list" | "board">("list")

  const filteredTasks = useMemo(() => {
    return projectTasks.filter((t) => {
      const okStatus = filters.status === "toutes" ? true : t.status === filters.status
      const okPriority =
        filters.priority === "toutes" ? true : t.priority === filters.priority
      return okStatus && okPriority
    })
  }, [filters.priority, filters.status, projectTasks])

  const mentionUsers = useMemo(() => {
    return users.map((user) => ({
      id: String(user.id),
      label: user.tag ? `${user.name}#${user.tag}` : user.name,
    }))
  }, [users])

  const assignableUsers = useMemo(() => {
    if (!selectedTask || !project) return []

    const map = new Map<string, { id: string; label: string }>()

    if (currentUser?.id != null && (currentUser.name || currentUser.email)) {
      const label = currentUser.name || currentUser.email || "Moi"
      map.set(String(currentUser.id), { id: String(currentUser.id), label })
    }

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
  }, [currentUser?.email, currentUser?.id, currentUser?.name, project, selectedTask, teams])

  function syncTaskTags(taskId: Task["id"], tags: TaskTag[]) {
    const task = projectTasks.find((item) => item.id === taskId)
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
      setIsCreateTaskOpen(false)
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

  async function handleUpdateProject(payload: ProjectPayload) {
    if (!project) return
    setIsSubmitting(true)
    setEditProjectErrors(null)
    try {
      await updateProject(project.id, payload)
      setIsEditProjectOpen(false)
    } catch (err: unknown) {
      setEditProjectErrors(getValidationErrors(err))
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

  if (projectsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="text-muted-foreground">Projet introuvable</div>
        <Button variant="outline" onClick={() => navigate("/projects/me")}>
          ← Retour aux projets
        </Button>
      </div>
    )
  }

  const teamName = getProjectTeamName(project)
  const ownerName = getProjectOwnerName(project)
  const displayName = (project.team_id === null || project.team === null) ? ownerName : teamName
  const { done, total } = getProjectProgress(project)
  const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="h-full w-full">
      {/* Project Info Section */}
      <div className="page-header">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate("/projects/me")}
          >
            <ArrowLeft className="size-4" />
            Projets
          </Button>
        </div>
        <div className="min-w-0 flex-1">
          <div className="page-title">{project.name}</div>
          <div className="page-subtitle">
            {done}/{total} tâche{total > 1 ? "s" : ""} terminée{done > 1 ? "s" : ""}
          </div>
        </div>
        <Dialog
          open={isEditProjectOpen}
          onOpenChange={(open) => {
            setIsEditProjectOpen(open)
            if (open) setEditProjectErrors(null)
          }}
        >
          <DialogTrigger asChild>
            <Button variant="outline">
              Modifier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Modifier le projet</DialogTitle>
            </DialogHeader>
            <ProjectForm
              teams={teams}
              initialProject={project}
              isSubmitting={isSubmitting}
              errors={editProjectErrors}
              onCancel={() => setIsEditProjectOpen(false)}
              onSubmit={handleUpdateProject}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="page-section space-y-5">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge className={cn("border-0", projectStatusBadgeClass(project.status))}>
              {projectStatusLabel(project.status)}
            </Badge>
          </div>
          {project.description && (
            <div className="mb-3 text-sm text-muted-foreground">
              {project.description}
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/50 px-3 py-2">
              <span className="text-muted-foreground">{project.team_id === null || project.team === null ? 'Propriétaire' : 'Équipe'}</span>
              <span className="truncate font-medium">{displayName}</span>
            </div>
            {project.deadline && (
              <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/50 px-3 py-2">
                <span className="text-muted-foreground">Deadline</span>
                <span className="font-medium">{project.deadline}</span>
              </div>
            )}
          </div>
          <div className="mt-3 space-y-2 rounded-lg border bg-muted/50 px-3 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">
                {progressPercent}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-lg font-semibold">Tâches du projet</div>
            <div className="flex items-center gap-2">
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
                open={isCreateTaskOpen}
                onOpenChange={(open) => {
                  setIsCreateTaskOpen(open)
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
                    projects={[project]}
                    isSubmitting={isSubmitting}
                    errors={createErrors}
                    onCancel={() => setIsCreateTaskOpen(false)}
                    onSubmit={handleCreate}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{projectTasks.length} total</Badge>
          </div>

          <TaskFilters value={filters} onChange={setFilters} />

          {view === "board" ? (
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
        </div>
      </div>

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
            projects={[project]}
            initialTask={editingTask}
            isSubmitting={isSubmitting}
            errors={editErrors}
            onCancel={() => setEditingTask(null)}
            onSubmit={handleUpdate}
          />
        </DialogContent>
      </Dialog>

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
