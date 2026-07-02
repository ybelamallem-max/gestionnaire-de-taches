import { useEffect, useMemo, useState } from "react"
import { format, isValid, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { Send, X } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTaskDetails } from "@/hooks/useTaskDetails"
import type { TaskComment } from "@/hooks/useTaskDetails"
import type { Task, TaskTag } from "@/types/task"
import { useAuthStore } from "@/stores/authStore"
import {
  priorityBadgeClass,
  priorityLabel,
  statusBadgeClass,
  statusLabel,
  tagStyle,
} from "@/lib/tasks"
import { cn } from "@/lib/utils"

type MentionUser = {
  id: string
  label: string
}

type AssignableUser = {
  id: string
  label: string
}

type TaskDetailsPanelProps = {
  task: Task | null
  open: boolean
  mentionUsers: MentionUser[]
  assignableUsers: AssignableUser[]
  onAssign: (taskId: Task["id"], userId: string | number) => Promise<void> | void
  onClose: () => void
  onTagsChange: (taskId: Task["id"], tags: TaskTag[]) => void
  canManageTask?: boolean
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—"
  const parsed = parseISO(value)
  if (!isValid(parsed)) return "—"
  return format(parsed, "dd MMM yyyy", { locale: fr })
}

function getAuthorName(comment: TaskComment) {
  if (comment.user?.name) return comment.user.name
  if (comment.user?.email) return comment.user.email
  return "Utilisateur"
}

function getMentionQuery(value: string) {
  const match = value.match(/(?:^|\s)@([^\s@]*)$/)
  return match ? match[1] : null
}

function applyMention(value: string, mentionLabel: string) {
  return value.replace(/(?:^|\s)@([^\s@]*)$/, (match) => {
    const prefix = match.startsWith(" ") ? " " : ""
    return `${prefix}@${mentionLabel} `
  })
}

export function TaskDetailsPanel({
  task,
  open,
  mentionUsers,
  assignableUsers,
  onAssign,
  onClose,
  onTagsChange,
  canManageTask = true,
}: TaskDetailsPanelProps) {
  const currentUser = useAuthStore((state) => state.user)
  const { comments, tags, isLoading, error, addComment, deleteComment, addTag, deleteTag } =
    useTaskDetails(task?.id ?? null)

  const [commentContent, setCommentContent] = useState("")
  const [tagName, setTagName] = useState("")
  const [tagColor, setTagColor] = useState("#8b5cf6")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isSubmittingTag, setIsSubmittingTag] = useState(false)
  const [assigneeId, setAssigneeId] = useState<string>("none")
  const [isAssigning, setIsAssigning] = useState(false)

  const mentionQuery = useMemo(() => getMentionQuery(commentContent), [commentContent])

  const filteredMentionUsers = useMemo(() => {
    if (mentionQuery == null) return []
    const query = mentionQuery.trim().toLowerCase()
    return mentionUsers.filter((user) =>
      query ? user.label.toLowerCase().includes(query) : true
    )
  }, [mentionQuery, mentionUsers])

  useEffect(() => {
    if (!task) return
    if (task.assigned_to != null) {
      setAssigneeId(String(task.assigned_to))
      return
    }
    setAssigneeId("none")
  }, [task])

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!task || !commentContent.trim()) return
    setIsSubmittingComment(true)
    try {
      await addComment(commentContent.trim())
      setCommentContent("")
    } finally {
      setIsSubmittingComment(false)
    }
  }

  async function handleAssign() {
    if (!task) return
    if (assigneeId === "none") return
    setIsAssigning(true)
    try {
      await onAssign(task.id, assigneeId)
    } finally {
      setIsAssigning(false)
    }
  }

  async function handleAddTag(e: React.FormEvent) {
    e.preventDefault()
    if (!task || !tagName.trim()) return
    setIsSubmittingTag(true)
    try {
      const created = await addTag({ name: tagName.trim(), color: tagColor })
      if (created) {
        onTagsChange(task.id, [...tags, created])
      }
      setTagName("")
    } finally {
      setIsSubmittingTag(false)
    }
  }

  async function handleDeleteTag(tagId: TaskTag["id"]) {
    if (!task) return
    await deleteTag(tagId)
    onTagsChange(
      task.id,
      tags.filter((tag) => tag.id !== tagId)
    )
  }

  function canDeleteComment(comment: TaskComment) {
    if (currentUser?.id != null && comment.user_id != null) {
      return String(currentUser.id) === String(comment.user_id)
    }
    if (currentUser?.id != null && comment.user?.id != null) {
      return String(currentUser.id) === String(comment.user.id)
    }
    if (currentUser?.email && comment.user?.email) {
      return currentUser.email === comment.user.email
    }
    return false
  }

  if (!task && !open) return null

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-xl transform flex-col border-l bg-background shadow-md transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full pointer-events-none"
        )}
      >
        <div className="flex items-start justify-between border-b px-6 py-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("border-0", priorityBadgeClass(task.priority))}>
                {priorityLabel(task.priority)}
              </Badge>
              <Badge className={cn("border-0", statusBadgeClass(task.status))}>
                {statusLabel(task.status)}
              </Badge>
            </div>
            <div className="text-lg font-medium text-foreground">{task.title}</div>
            <div className="text-sm text-muted-foreground">
              Deadline {formatDate(task.deadline)} • Projet {task.project || "—"}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X />
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {task.description ? (
            <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground shadow-xs">
              {task.description}
            </div>
          ) : null}

          <section className="space-y-3">
            <div className="text-sm font-medium text-foreground">Assignation</div>
            {canManageTask && assignableUsers.length ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Assigner à..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>
                      Assigner à...
                    </SelectItem>
                    {assignableUsers.map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  disabled={isAssigning || assigneeId === "none"}
                  className="h-9"
                  onClick={() => void handleAssign()}
                >
                  {isAssigning ? "Assignation..." : "Assigner"}
                </Button>
              </div>
            ) : canManageTask ? (
              <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground shadow-xs">
                Aucun membre disponible pour assigner cette tâche.
              </div>
            ) : (
              <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground shadow-xs">
                Modification de l’assignation réservée aux gestionnaires du projet.
              </div>
            )}
          </section>

          {error ? (
            <div className="rounded-lg border bg-card p-4 text-sm text-destructive shadow-xs">
              {error}
            </div>
          ) : null}

          <section className="space-y-3">
            <div className="text-sm font-medium text-foreground">Tags</div>
            <div className="flex flex-wrap gap-2">
              {tags.length ? (
                tags.map((tag) => (
                  <button
                    key={String(tag.id)}
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-100"
                    style={tagStyle(tag)}
                    onClick={() => void handleDeleteTag(tag.id)}
                    disabled={!canManageTask}
                  >
                    <span>{tag.name}</span>
                    {canManageTask ? <span className="text-[10px] opacity-80">Supprimer</span> : null}
                  </button>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">Aucun tag</div>
              )}
            </div>
            {canManageTask ? (
              <form onSubmit={handleAddTag} className="flex flex-col gap-3 sm:flex-row">
                <Input
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="Nom du tag"
                />
                <label className="flex h-9 w-full items-center gap-2 rounded-md border bg-card px-3 text-sm text-muted-foreground shadow-xs sm:w-36">
                  <span>Couleur</span>
                  <input
                    value={tagColor}
                    onChange={(e) => setTagColor(e.target.value)}
                    type="color"
                    className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
                  />
                </label>
                <Button
                  type="submit"
                  disabled={isSubmittingTag || !tagName.trim()}
                >
                  {isSubmittingTag ? "Ajout..." : "Ajouter"}
                </Button>
              </form>
            ) : (
              <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground shadow-xs">
                Gestion des tags réservée aux gestionnaires du projet.
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="text-sm font-medium text-foreground">Commentaires</div>
            <form onSubmit={handleCommentSubmit} className="space-y-3">
              <div className="relative">
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Écrire un commentaire. Tapez @ pour mentionner quelqu’un."
                  className="min-h-28 w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
                {mentionQuery != null && filteredMentionUsers.length ? (
                  <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-lg border bg-popover shadow-md">
                    {filteredMentionUsers.slice(0, 6).map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                        onClick={() => setCommentContent((prev) => applyMention(prev, user.label))}
                      >
                        <Avatar className="size-7">
                          <AvatarFallback>{user.label.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>{user.label}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmittingComment || !commentContent.trim()}
                >
                  <Send />
                  {isSubmittingComment ? "Envoi..." : "Commenter"}
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              {isLoading ? (
                <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground shadow-xs">
                  Chargement...
                </div>
              ) : comments.length ? (
                comments.map((comment) => (
                  <div
                    key={String(comment.id)}
                    className="rounded-lg border bg-card p-4 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback>
                            {getAuthorName(comment).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {getAuthorName(comment)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(comment.created_at)}
                          </div>
                        </div>
                      </div>
                      {canDeleteComment(comment) ? (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => void deleteComment(comment.id)}
                        >
                          Supprimer
                        </Button>
                      ) : null}
                    </div>
                    <div className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                      {comment.content}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground shadow-xs">
                  Aucun commentaire pour le moment.
                </div>
              )}
            </div>
          </section>
        </div>
      </aside>
    </>
  )
}
