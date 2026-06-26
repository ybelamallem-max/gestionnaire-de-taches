import { create } from "zustand"

import { api } from "@/services/api"
import { getApiMessage } from "@/services/apiErrors"
import { useAuthStore } from "./authStore"

export type NotificationItem = {
  id: string | number
  type?: string | null
  title?: string | null
  message?: string | null
  data?: unknown
  read_at?: string | null
  created_at?: string | null
  task_id?: string | number | null
  project_id?: string | number | null
  task?: { id?: string | number; title?: string | null } | null
  project?: { id?: string | number; name?: string | null } | null
}

type ApiNotification = NotificationItem

type NotificationsState = {
  items: NotificationItem[]
  isLoading: boolean
  error: string | null
  fetchNotifications: () => Promise<void>
  markAsRead: (id: NotificationItem["id"]) => Promise<void>
  markAllAsRead: () => Promise<void>
  acceptTeamInvite: (teamId: string | number) => Promise<void>
  rejectTeamInvite: (teamId: string | number) => Promise<void>
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  fetchNotifications: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.get<{ notifications: ApiNotification[] }>("/notifications")
      set({ items: res.data.notifications ?? [] })
    } catch (err: unknown) {
      set({ error: getApiMessage(err, "Erreur lors du chargement des notifications.") })
    } finally {
      set({ isLoading: false })
    }
  },
  markAsRead: async (id) => {
    try {
      const res = await api.patch<{ notification: ApiNotification }>(`/notifications/${id}/read`)
      const updated = res.data.notification
      if (!updated) return
      set({
        items: get().items.map((item) => (String(item.id) === String(id) ? updated : item)),
      })
    } catch (err: unknown) {
      set({ error: getApiMessage(err, "Erreur lors de la mise à jour de la notification.") })
    }
  },
  markAllAsRead: async () => {
    try {
      await api.patch("/notifications/read-all")
      set({
        items: get().items.map((item) => ({ ...item, read_at: new Date().toISOString() })),
      })
    } catch (err: unknown) {
      set({ error: getApiMessage(err, "Erreur lors de la mise à jour des notifications.") })
    }
  },
  acceptTeamInvite: async (teamId) => {
    try {
      const userId = useAuthStore.getState().user?.id
      if (!userId) return
      await api.put(`/teams/${teamId}/members/${userId}/accept`)
      await get().fetchNotifications()
    } catch (err: unknown) {
      set({ error: getApiMessage(err, "Erreur lors de l'acceptation de l'invitation.") })
    }
  },
  rejectTeamInvite: async (teamId) => {
    try {
      const userId = useAuthStore.getState().user?.id
      if (!userId) return
      await api.put(`/teams/${teamId}/members/${userId}/reject`)
      await get().fetchNotifications()
    } catch (err: unknown) {
      set({ error: getApiMessage(err, "Erreur lors du rejet de l'invitation.") })
    }
  },
}))

export function selectUnreadCount(state: Pick<NotificationsState, "items">) {
  return state.items.filter((n) => !n.read_at).length
}

