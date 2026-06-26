import { Bell, ChevronRight, Search } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { api } from "@/services/api"
import { useAuthStore } from "@/stores/authStore"
import { formatDisplayName, getAvatarInitials } from "@/lib/users"
import { useState, useEffect } from "react"
import { GlobalSearch } from "./GlobalSearch"

export function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const title = pathname.startsWith("/tasks")
    ? "Tâches"
    : pathname.startsWith("/projects")
      ? "Projets"
      : pathname.startsWith("/teams")
        ? "Équipes"
        : pathname.startsWith("/notifications")
          ? "Notifications"
          : pathname.startsWith("/admin")
            ? "Admin"
            : "Dashboard"

  const subtitle = pathname.startsWith("/tasks")
    ? "Gérez vos tâches et priorités"
    : pathname.startsWith("/projects")
      ? "Suivez vos projets et leur progression"
      : pathname.startsWith("/teams")
        ? "Organisez vos équipes et leurs membres"
        : pathname.startsWith("/notifications")
          ? "Suivez les dernières activités"
          : pathname.startsWith("/admin")
            ? "Gestion des utilisateurs"
            : "Vue d'ensemble de votre activité"

  async function handleLogout() {
    try {
      await api.post("/logout")
    } finally {
      logout()
      navigate("/login", { replace: true })
    }
  }

  return (
    <header className="page-header-compact">
      <div className="flex min-w-0 items-center gap-3">
        <div className="hidden min-w-0 items-center gap-2 text-sm text-muted-foreground md:flex">
          <span>Workspace</span>
          <ChevronRight className="size-3.5" />
          <span className="truncate font-medium text-foreground">{title}</span>
        </div>
        <div className="md:hidden">
          <div className="truncate text-sm font-medium">{title}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden w-64 items-center md:flex"
        >
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <div className="flex h-8 w-full items-center rounded-md border border-border bg-background px-8 text-sm text-muted-foreground shadow-sm">
              Rechercher...
            </div>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
              Ctrl+K
            </span>
          </div>
        </button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => navigate("/notifications")}
        >
          <Bell className="size-4" />
        </Button>

        <div className="lg:hidden">
          <ThemeToggle />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-full transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Avatar className="size-8">
                <AvatarFallback>
                  {getAvatarInitials(user)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{formatDisplayName(user)}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>Profil</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>Paramètres</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => void handleLogout()}>
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}





