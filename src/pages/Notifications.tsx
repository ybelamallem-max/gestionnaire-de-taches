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
    <div className="h-full">
      <div className="page-header">
        <div className="flex flex-col gap-1">
          <div className="page-title">Notifications</div>
          <div className="page-subtitle">
            {items.length} notification{items.length > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="page-section space-y-4">

        {error ? (
          <div className="panel-muted text-destructive">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="empty-state">
            Chargement...
          </div>
        ) : items.length ? (
          <div className="list-shell divide-y">
            {items.map((n) => {
              const isUnread = !n.read_at
              return (
                <button
                  key={String(n.id)}
                  type="button"
                  onClick={() => void markAsRead(n.id)}
                  className={cn(
                    "flex w-full items-start justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-sidebar/50",
                    isUnread && "bg-secondary/30"
                  )}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">
                      {getTitle(n)}
                    </div>
                    {n.message ? (
                      <div className="mt-1 text-sm text-muted-foreground">
                        {n.message}
                      </div>
                    ) : null}
                  </div>
                  {isUnread ? (
                    <div className="mt-0.5 shrink-0 rounded-full border bg-background px-2 py-0.5 text-[10px] font-medium">
                      Nouveau
                    </div>
                  ) : (
                    <div className="mt-0.5 shrink-0 text-[10px] text-muted-foreground">
                      Lu
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            Aucune notification.
          </div>
        )}
      </div>
    </div>
  )
}

