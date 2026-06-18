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
import type { Task, TaskTag } from "@/hooks/useTasks"
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

  if (!task) return null

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
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-xl transform flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-start justify-between border-b border-zinc-800 px-6 py-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("border-0", priorityBadgeClass(task.priority))}>
                {priorityLabel(task.priority)}
              </Badge>
              <Badge className={cn("border-0", statusBadgeClass(task.status))}>
                {statusLabel(task.status)}
              </Badge>
            </div>
            <div className="text-lg font-medium text-zinc-100">{task.title}</div>
            <div className="text-sm text-zinc-400">
              Deadline {formatDate(task.deadline)} • Projet {task.project || "—"}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
            onClick={onClose}
          >
            <X />
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {task.description ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-300">
              {task.description}
            </div>
          ) : null}

          <section className="space-y-3">
            <div className="text-sm font-medium text-zinc-100">Assignation</div>
            {assignableUsers.length ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger className="h-10 w-full border-zinc-800 bg-zinc-900/70 text-zinc-100 data-[placeholder]:text-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-700/40">
                    <SelectValue placeholder="Assigner à..." />
                  </SelectTrigger>
                  <SelectContent className="border border-zinc-800 bg-zinc-950 text-zinc-100">
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
                  className="h-10 bg-zinc-100 text-zinc-950 hover:bg-zinc-100/90"
                  onClick={() => void handleAssign()}
                >
                  {isAssigning ? "Assignation..." : "Assigner"}
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-400">
                Aucun membre disponible pour assigner cette tâche.
              </div>
            )}
          </section>

          {error ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-300">
              {error}
            </div>
          ) : null}

          <section className="space-y-3">
            <div className="text-sm font-medium text-zinc-100">Tags</div>
            <div className="flex flex-wrap gap-2">
              {tags.length ? (
                tags.map((tag) => (
                  <button
                    key={String(tag.id)}
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-opacity hover:opacity-90"
                    style={tagStyle(tag)}
                    onClick={() => void handleDeleteTag(tag.id)}
                  >
                    <span>{tag.name}</span>
                    <span className="text-[10px] opacity-80">Supprimer</span>
                  </button>
                ))
              ) : (
                <div className="text-sm text-zinc-500">Aucun tag</div>
              )}
            </div>
            <form onSubmit={handleAddTag} className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="Nom du tag"
                className="h-10 border-zinc-800 bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-700/40"
              />
              <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 text-sm text-zinc-300 sm:w-36">
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
                className="bg-zinc-100 text-zinc-950 hover:bg-zinc-100/90"
              >
                {isSubmittingTag ? "Ajout..." : "Ajouter"}
              </Button>
            </form>
          </section>

          <section className="space-y-4">
            <div className="text-sm font-medium text-zinc-100">Commentaires</div>
            <form onSubmit={handleCommentSubmit} className="space-y-3">
              <div className="relative">
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Écrire un commentaire. Tapez @ pour mentionner quelqu’un."
                  className="min-h-28 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus-visible:ring-2 focus-visible:ring-zinc-700/40"
                />
                {mentionQuery != null && filteredMentionUsers.length ? (
                  <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl">
                    {filteredMentionUsers.slice(0, 6).map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-200 transition-colors hover:bg-zinc-900"
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
                  className="bg-zinc-100 text-zinc-950 hover:bg-zinc-100/90"
                >
                  <Send />
                  {isSubmittingComment ? "Envoi..." : "Commenter"}
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              {isLoading ? (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-400">
                  Chargement...
                </div>
              ) : comments.length ? (
                comments.map((comment) => (
                  <div
                    key={String(comment.id)}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback>
                            {getAuthorName(comment).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-zinc-100">
                            {getAuthorName(comment)}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {formatDate(comment.created_at)}
                          </div>
                        </div>
                      </div>
                      {canDeleteComment(comment) ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                          onClick={() => void deleteComment(comment.id)}
                        >
                          Supprimer
                        </Button>
                      ) : null}
                    </div>
                    <div className="mt-3 whitespace-pre-wrap text-sm text-zinc-300">
                      {comment.content}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-400">
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
