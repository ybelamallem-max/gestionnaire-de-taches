import { useEffect, useState } from "react"
import { formatDistanceToNow, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { UserPlus, UserCheck, UserMinus, Users, ClipboardList, AtSign, FolderCheck, CheckCircle, CheckCheck, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useNotificationsStore } from "@/stores/notificationsStore"

function getTitle(n: { title?: string | null; message?: string | null }) {
  if (n.title?.trim()) return n.title
  if (n.message?.trim()) return n.message
  return "Notification"
}

function getNotificationIcon(type?: string | null) {
  switch (type) {
    case 'team_invite':
      return UserPlus
    case 'team_invite_accepted':
      return UserCheck
    case 'team_invite_rejected':
      return UserMinus
    case 'team_member_added':
      return Users
    case 'team_removed':
      return UserMinus
    case 'task_assigned':
      return ClipboardList
    case 'comment_mention':
      return AtSign
    case 'task_completed':
      return CheckCircle
    case 'project_completed':
      return FolderCheck
    default:
      return CheckCheck
  }
}

function formatRelativeTime(dateString?: string | null) {
  if (!dateString) return ""
  try {
    const date = parseISO(dateString)
    return formatDistanceToNow(date, { addSuffix: true, locale: fr })
  } catch {
    return ""
  }
}

export default function Notifications() {
  const items = useNotificationsStore((s) => s.items)
  const isLoading = useNotificationsStore((s) => s.isLoading)
  const error = useNotificationsStore((s) => s.error)
  const fetchNotifications = useNotificationsStore((s) => s.fetchNotifications)
  const markAsRead = useNotificationsStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead)
  const acceptTeamInvite = useNotificationsStore((s) => s.acceptTeamInvite)
  const rejectTeamInvite = useNotificationsStore((s) => s.rejectTeamInvite)

  const [searchQuery, setSearchQuery] = useState("")

  const filteredItems = items.filter(item =>
    (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.message && item.message.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  useEffect(() => {
    void fetchNotifications()
  }, [fetchNotifications])

  const hasUnread = items.some((n) => !n.read_at)

  return (
    <div className="h-full">
      <div className="page-header">
        <div className="flex flex-col gap-1">
          <div className="page-title">Notifications</div>
          <div className="page-subtitle">
            {items.length} notification{items.length > 1 ? "s" : ""}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasUnread && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void markAllAsRead()}
            >
              Tout marquer comme lu
            </Button>
          )}
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
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
        ) : filteredItems.length ? (
          <div className="list-shell divide-y">
            {filteredItems.map((n) => {
              const isUnread = !n.read_at
              const Icon = getNotificationIcon(n.type)
              const data = n.data as { team_id?: string | number } | null
              const teamId = data?.team_id
              
              return (
                <button
                  key={String(n.id)}
                  type="button"
                  onClick={() => void markAsRead(n.id)}
                  className={cn(
                    "flex w-full items-start gap-4 px-6 py-4 text-left transition-colors hover:bg-sidebar/50",
                    isUnread && "bg-secondary/30"
                  )}
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="size-5 text-muted-foreground" />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">
                      {n.title || "Notification"}
                    </div>
                    {n.message ? (
                      <div className="mt-1 text-sm text-muted-foreground">
                        {n.message}
                      </div>
                    ) : null}
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatRelativeTime(n.created_at)}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {(n.type === 'team_invite' || n.type === 'team_request') && teamId && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            void acceptTeamInvite(teamId)
                          }}
                        >
                          Accepter
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            void rejectTeamInvite(teamId)
                          }}
                        >
                          Refuser
                        </Button>
                      </div>
                    )}
                    {isUnread ? (
                      <div className="mt-0.5 shrink-0 rounded-full border bg-background px-2 py-0.5 text-[10px] font-medium">
                        Nouveau
                      </div>
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            {searchQuery ? "Aucune notification ne correspond à votre recherche." : "Aucune notification."}
          </div>
        )}
      </div>
    </div>
  )
}

