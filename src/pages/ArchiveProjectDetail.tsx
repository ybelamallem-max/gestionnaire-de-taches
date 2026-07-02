import { useMemo, useState } from "react"
import { ArrowLeft, ArchiveRestore } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"

import { TaskBoard } from "@/components/tasks/TaskBoard"
import { TaskDetailsPanel } from "@/components/tasks/TaskDetailsPanel"
import { TaskFilters } from "@/components/tasks/TaskFilters"
import type {
  TaskPriorityFilter,
  TaskStatusFilter,
} from "@/components/tasks/TaskFilters"
import { TaskList } from "@/components/tasks/TaskList"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Task, TaskTag } from "@/types/task"
import type { Project } from "@/types/project"
import { useArchive } from "@/hooks/useArchive"
import { useTasks } from "@/hooks/useTasks"
import { useTeams } from "@/hooks/useTeams"
import { useUsers } from "@/hooks/useUsers"
import { canViewAll } from "@/lib/roles"
import { useAuthStore } from "@/stores/authStore"
import {
  getProjectProgress,
  getProjectTeamName,
  getProjectOwnerName,
  projectStatusBadgeClass,
  projectStatusLabel,
} from "@/lib/projects"
import { cn } from "@/lib/utils"

export default function ArchiveProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const dataScope = canViewAll(currentUser?.role) ? "all" : undefined
  const { projects, isLoading: projectsLoading, unarchiveProject } = useArchive()
  const { tasks } = useTasks(dataScope)
  const { teams } = useTeams()
  const { users } = useUsers()

  const [isUnarchiveDialogOpen, setIsUnarchiveDialogOpen] = useState(false)
  const [isUnarchiving, setIsUnarchiving] = useState(false)

  const canUnarchive = currentUser?.role === "admin"

  async function handleUnarchive() {
    if (!project) return
    setIsUnarchiving(true)
    try {
      await unarchiveProject(project.id)
      navigate("/archive")
    } catch (err) {
      // Error is handled by the hook
    } finally {
      setIsUnarchiving(false)
      setIsUnarchiveDialogOpen(false)
    }
  }

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

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

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
    // Archive is read-only, so we don't sync tags
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
        <Button variant="outline" onClick={() => navigate("/archive")}>
          ← Retour à l'archive
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
            onClick={() => navigate("/archive")}
          >
            <ArrowLeft className="size-4" />
            Archive
          </Button>
        </div>
        <div className="min-w-0 flex-1">
          <div className="page-title">{project.name}</div>
          <div className="page-subtitle">
            {done}/{total} tâche{total > 1 ? "s" : ""} terminée{done > 1 ? "s" : ""}
          </div>
        </div>
        {canUnarchive && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsUnarchiveDialogOpen(true)}
          >
            <ArchiveRestore className="size-4 mr-2" />
            Désarchiver
          </Button>
        )}
      </div>

      <div className="page-section space-y-5">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge className={cn("border-0", projectStatusBadgeClass(project.status))}>
              {projectStatusLabel(project.status)}
            </Badge>
            <Badge variant="outline" className="text-xs">Archivé</Badge>
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
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{projectTasks.length} total</Badge>
          </div>

          <TaskFilters value={filters} onChange={setFilters} />

          <TaskList
            tasks={filteredTasks}
            onToggle={() => {}}
            onDelete={() => {}}
            onEdit={() => {}}
            onOpenDetails={(task) => setSelectedTask(task)}
          />
        </div>
      </div>

      <TaskDetailsPanel
        task={selectedTask}
        open={!!selectedTask}
        mentionUsers={mentionUsers}
        assignableUsers={assignableUsers}
        onAssign={() => {}}
        onClose={() => setSelectedTask(null)}
        onTagsChange={syncTaskTags}
      />

      <Dialog open={isUnarchiveDialogOpen} onOpenChange={setIsUnarchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Désarchiver le projet</DialogTitle>
            <DialogDescription>
              Voulez-vous vraiment désarchiver le projet « {project?.name} » ? Il sera réactivé et apparaîtra à nouveau dans la liste des projets actifs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUnarchiveDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={isUnarchiving}
              onClick={handleUnarchive}
            >
              {isUnarchiving ? "Désarchivage..." : "Désarchiver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
