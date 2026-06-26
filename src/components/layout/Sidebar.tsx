import {
  Bell,
  Eye,
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  Shield,
  User,
  Users,
  CheckSquare2,
} from "lucide-react"
import type { ComponentType } from "react"
import { useEffect, useState } from "react"
import { NavLink } from "react-router-dom"

import { useAuthStore } from "@/stores/authStore"
import { canViewAll } from "@/lib/roles"
import { selectUnreadCount, useNotificationsStore } from "@/stores/notificationsStore"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatDisplayName } from "@/lib/users"

type NavItem = {
  key: string
  label: string
  icon: ComponentType<{ className?: string }>
  badge?: string
  to?: string
  disabled?: boolean
}

const navItems: NavItem[] = [
  { key: "teams", label: "Équipes", icon: Users, to: "/teams" },
  { key: "notifications", label: "Notifications", icon: Bell, to: "/notifications" },
  { key: "admin", label: "Admin", icon: Shield, to: "/admin/users" },
]

export function Sidebar() {
  const currentUser = useAuthStore((s) => s.user)
  const unreadCount = useNotificationsStore(selectUnreadCount)
  const fetchNotifications = useNotificationsStore((s) => s.fetchNotifications)
  const [openAccordion, setOpenAccordion] = useState<"tasks" | "projects" | null>(() => {
    const saved = localStorage.getItem('sidebar_accordion')
    return saved === 'tasks' || saved === 'projects' ? saved : null
  })

  useEffect(() => {
    void fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    localStorage.setItem('sidebar_accordion', openAccordion || 'null')
  }, [openAccordion])

  const visibleItems = navItems.filter((item) => {
    if (item.key === "admin") return currentUser?.role === "admin"
    return true
  }).map((item) => {
    if (item.key !== "notifications") return item
    return { ...item, badge: unreadCount > 0 ? String(unreadCount) : undefined }
  })

  const showAllScope = canViewAll(currentUser?.role)

  return (
    <aside className="hidden h-svh w-[244px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-md border bg-background">
            <div className="size-2 rounded-full bg-foreground/80" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-sidebar-foreground">
              Gestionnaire de tâches
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {formatDisplayName(currentUser) || "Workspace"}
            </div>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <Separator />

      <div className="px-3 pb-2">
        <div className="rounded-lg border bg-background px-3 py-3 shadow-xs">
          <div className="text-sm font-semibold">{currentUser?.name || "Espace principal"}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Navigation, tâches, projets et équipes.
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {/* Dashboard */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              "flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-sm transition-colors",
              "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
            )
          }
        >
          <LayoutDashboard className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">Dashboard</span>
        </NavLink>

        {/* Tâches Accordion */}
        <div>
          <button
            type="button"
            onClick={() => setOpenAccordion(openAccordion === "tasks" ? null : "tasks")}
            className={cn(
              "flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm transition-colors",
              "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <CheckSquare2 className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">Tâches</span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 transition-transform duration-200",
                openAccordion === "tasks" && "rotate-180"
              )}
            />
          </button>
          <div
            className={cn(
              "overflow-hidden transition-all duration-200",
              openAccordion === "tasks" ? "max-h-52" : "max-h-0"
            )}
          >
            <div className="flex flex-col gap-1 py-1 pl-6">
              <NavLink
                to="/tasks/me"
                className={({ isActive }) =>
                  cn(
                    "flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-sm transition-colors",
                    "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  )
                }
              >
                <User className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">Mes tâches</span>
              </NavLink>
              <NavLink
                to="/tasks/team"
                className={({ isActive }) =>
                  cn(
                    "flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-sm transition-colors",
                    "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  )
                }
              >
                <Users className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">Tâches équipe</span>
              </NavLink>
              {showAllScope ? (
                <NavLink
                  to="/tasks/all"
                  className={({ isActive }) =>
                    cn(
                      "flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-sm transition-colors",
                      "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    )
                  }
                >
                  <Eye className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">Toutes les tâches</span>
                </NavLink>
              ) : null}
            </div>
          </div>
        </div>

        {/* Projets Accordion */}
        <div>
          <button
            type="button"
            onClick={() => setOpenAccordion(openAccordion === "projects" ? null : "projects")}
            className={cn(
              "flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm transition-colors",
              "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <FolderKanban className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">Projets</span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 transition-transform duration-200",
                openAccordion === "projects" && "rotate-180"
              )}
            />
          </button>
          <div
            className={cn(
              "overflow-hidden transition-all duration-200",
              openAccordion === "projects" ? "max-h-52" : "max-h-0"
            )}
          >
            <div className="flex flex-col gap-1 py-1 pl-6">
              <NavLink
                to="/projects/me"
                className={({ isActive }) =>
                  cn(
                    "flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-sm transition-colors",
                    "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  )
                }
              >
                <User className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">Mes projets</span>
              </NavLink>
              <NavLink
                to="/projects/team"
                className={({ isActive }) =>
                  cn(
                    "flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-sm transition-colors",
                    "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  )
                }
              >
                <Users className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">Projets équipe</span>
              </NavLink>
              {showAllScope ? (
                <NavLink
                  to="/projects/all"
                  className={({ isActive }) =>
                    cn(
                      "flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-sm transition-colors",
                      "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    )
                  }
                >
                  <Eye className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">Tous les projets</span>
                </NavLink>
              ) : null}
            </div>
          </div>
        </div>

        {visibleItems.map((item) => {
          const Icon = item.icon

          return (
            <div key={item.key}>
              {item.to ? (
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-sm transition-colors",
                      "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    )
                  }
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.badge ? (
                    <Badge variant="secondary" className="bg-background text-foreground">
                      {item.badge}
                    </Badge>
                  ) : null}
                </NavLink>
              ) : (
                <button
                  type="button"
                  disabled={item.disabled}
                  className={cn(
                    "flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm text-sidebar-foreground/70 transition-colors",
                    item.disabled && "cursor-not-allowed opacity-60"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                </button>
              )}
            </div>
          )
        })}
      </nav>

      <div className="mt-auto px-3 pb-4 pt-2">
        <div className="rounded-lg border bg-background p-4 text-sm shadow-xs">
          <div className="font-semibold">Espace de travail</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Style Circle, logique métier conservée.
          </div>
        </div>
      </div>
    </aside>
  )
}
