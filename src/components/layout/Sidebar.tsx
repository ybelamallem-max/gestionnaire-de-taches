import {
  Bell,
  FolderKanban,
  LayoutDashboard,
  Shield,
  Users,
  CheckSquare2,
} from "lucide-react"
import type { ComponentType } from "react"
import { useEffect } from "react"
import { NavLink } from "react-router-dom"

import { useAuthStore } from "@/stores/authStore"
import { selectUnreadCount, useNotificationsStore } from "@/stores/notificationsStore"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type NavItem = {
  key: string
  label: string
  icon: ComponentType<{ className?: string }>
  badge?: string
  to?: string
  disabled?: boolean
}

const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/" },
  { key: "tasks", label: "Tâches", icon: CheckSquare2, to: "/tasks" },
  { key: "projects", label: "Projets", icon: FolderKanban, to: "/projects" },
  { key: "teams", label: "Équipes", icon: Users, to: "/teams" },
  { key: "notifications", label: "Notifications", icon: Bell, to: "/notifications" },
  { key: "admin", label: "Admin", icon: Shield, to: "/admin/users" },
]

export function Sidebar() {
  const currentUser = useAuthStore((s) => s.user)
  const unreadCount = useNotificationsStore(selectUnreadCount)
  const fetchNotifications = useNotificationsStore((s) => s.fetchNotifications)

  useEffect(() => {
    void fetchNotifications()
  }, [fetchNotifications])

  const visibleItems = navItems.filter((item) => {
    if (item.key === "admin") return currentUser?.role === "admin"
    return true
  }).map((item) => {
    if (item.key !== "notifications") return item
    return { ...item, badge: unreadCount > 0 ? String(unreadCount) : undefined }
  })

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="flex h-14 items-center gap-2 px-3">
        <div className="flex size-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-100">
          <div className="size-3 rounded-full bg-zinc-100" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-zinc-100">
            Task Manager
          </div>
          <div className="truncate text-xs text-zinc-400">UI Shell</div>
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      <nav className="flex flex-1 flex-col gap-1 p-2">
        {visibleItems.map((item) => {
          const Icon = item.icon

          return (
            <Tooltip key={item.key}>
              <TooltipTrigger asChild>
                {item.to ? (
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                        "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
                        isActive && "bg-zinc-900 text-zinc-100"
                      )
                    }
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.badge ? (
                      <Badge
                        variant="secondary"
                        className="border-zinc-800 bg-zinc-800/80 text-zinc-100"
                      >
                        {item.badge}
                      </Badge>
                    ) : null}
                  </NavLink>
                ) : (
                  <button
                    type="button"
                    disabled={item.disabled}
                    className={cn(
                      "group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                      "text-zinc-500",
                      item.disabled && "cursor-not-allowed opacity-60"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.badge ? (
                      <Badge
                        variant="secondary"
                        className="border-zinc-800 bg-zinc-800/80 text-zinc-100"
                      >
                        {item.badge}
                      </Badge>
                    ) : null}
                  </button>
                )}
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                <span>{item.label}</span>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </nav>
    </aside>
  )
}
