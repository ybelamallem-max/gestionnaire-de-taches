import { Bell, ChevronRight, Search } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

  async function handleLogout() {
    try {
      await api.post("/logout")
    } finally {
      logout()
      navigate("/login", { replace: true })
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-container px-6">
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

      <div className="flex items-center gap-3">
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden w-80 items-center md:flex"
        >
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <div className="flex h-9 w-full items-center rounded-lg border border-border bg-background px-10 text-sm text-muted-foreground shadow-sm">
              Rechercher...
            </div>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
              Ctrl+K
            </span>
          </div>
        </button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => navigate("/notifications")}
        >
          <Bell className="size-4" />
        </Button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-full transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Avatar className="size-9">
                <AvatarImage src={user?.avatar} alt={formatDisplayName(user)} />
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





