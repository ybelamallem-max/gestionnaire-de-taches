import { useEffect } from "react"

import { cn } from "@/lib/utils"
import { useNotificationsStore } from "@/stores/notificationsStore"

function getTitle(n: { title?: string | null; message?: string | null }) {
  if (n.title?.trim()) return n.title
  if (n.message?.trim()) return n.message
  return "Notification"
}

export default function Notifications() {
  const items = useNotificationsStore((s) => s.items)
  const isLoading = useNotificationsStore((s) => s.isLoading)
  const error = useNotificationsStore((s) => s.error)
  const fetchNotifications = useNotificationsStore((s) => s.fetchNotifications)
  const markAsRead = useNotificationsStore((s) => s.markAsRead)

  useEffect(() => {
    void fetchNotifications()
  }, [fetchNotifications])

  return (
    <div className="h-full rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <div className="text-sm font-medium text-zinc-100">Notifications</div>
          <div className="text-xs text-zinc-400">{items.length} notification{items.length > 1 ? "s" : ""}</div>
        </div>

        {error ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-200">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6 text-sm text-zinc-300">
            Chargement...
          </div>
        ) : items.length ? (
          <div className="space-y-2">
            {items.map((n) => {
              const isUnread = !n.read_at
              return (
                <button
                  key={String(n.id)}
                  type="button"
                  onClick={() => void markAsRead(n.id)}
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                    "border-zinc-800 bg-zinc-950/40 hover:bg-zinc-950/60",
                    isUnread && "ring-1 ring-zinc-700/60"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-zinc-100">
                        {getTitle(n)}
                      </div>
                      {n.message ? (
                        <div className="mt-1 text-sm text-zinc-400">
                          {n.message}
                        </div>
                      ) : null}
                    </div>
                    {isUnread ? (
                      <div className="mt-1 shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-950">
                        Nouveau
                      </div>
                    ) : (
                      <div className="mt-1 shrink-0 text-[10px] text-zinc-500">
                        Lu
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6 text-sm text-zinc-300">
            Aucune notification.
          </div>
        )}
      </div>
    </div>
  )
}

