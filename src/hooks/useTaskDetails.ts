import { useCallback, useEffect, useRef, useState } from "react"

import { api } from "@/services/api"
import type { TaskTag } from "@/types/task"

export type TaskCommentAuthor = {
  id?: string | number
  name?: string | null
  email?: string | null
}

export type TaskComment = {
  id: string | number
  content: string
  created_at?: string | null
  user_id?: string | number | null
  user?: TaskCommentAuthor | null
}

type TaskDetailsState = {
  comments: TaskComment[]
  tags: TaskTag[]
}

export function useTaskDetails(taskId: string | number | null, initialTags: TaskTag[] = []) {
  // Use a ref for initialTags to avoid it being a changing dependency
  const initialTagsRef = useRef(initialTags)

  const [state, setState] = useState<TaskDetailsState>({
    comments: [],
    tags: initialTags,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (taskId == null) return
    setIsLoading(true)
    setError(null)
    try {
      setState({
        comments: (await api.get<{ comments: TaskComment[] }>(`/tasks/${taskId}/comments`)).data
          .comments ?? [],
        tags: initialTagsRef.current,
      })
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err && "message" in err
          ? String((err as { message?: string }).message)
          : "Erreur lors du chargement des détails."
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [taskId]) // <-- initialTags removed from deps, accessed via ref instead

  const addComment = useCallback(
    async (content: string) => {
      if (taskId == null) return null
      setError(null)
      const res = await api.post<{ comment: TaskComment }>(`/tasks/${taskId}/comments`, { content })
      const created = res.data.comment ?? null
      if (created?.id != null) {
        setState((prev) => ({ ...prev, comments: [...prev.comments, created] }))
        return created
      }
      await refresh()
      return null
    },
    [refresh, taskId]
  )

  const deleteComment = useCallback(async (commentId: string | number) => {
    setError(null)
    await api.delete(`/comments/${commentId}`)
    setState((prev) => ({
      ...prev,
      comments: prev.comments.filter((comment) => comment.id !== commentId),
    }))
  }, [])

  const addTag = useCallback(
    async (payload: { name: string; color: string }) => {
      if (taskId == null) return null
      setError(null)
      const res = await api.post<{ tag: TaskTag }>(`/tasks/${taskId}/tags`, payload)
      const created = res.data.tag ?? null
      if (created?.id != null) {
        setState((prev) => ({ ...prev, tags: [...prev.tags, created] }))
        return created
      }
      await refresh()
      return null
    },
    [refresh, taskId]
  )

  const deleteTag = useCallback(async (tagId: string | number) => {
    setError(null)
    await api.delete(`/tags/${tagId}`)
    setState((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag.id !== tagId),
    }))
  }, [])

  useEffect(() => {
    if (taskId == null) {
      setState({ comments: [], tags: initialTagsRef.current })
      setError(null)
      return
    }
    void refresh()
  }, [refresh, taskId]) // <-- initialTags removed from deps here too

  return {
    comments: state.comments,
    tags: state.tags,
    isLoading,
    error,
    refresh,
    addComment,
    deleteComment,
    addTag,
    deleteTag,
  }
}
