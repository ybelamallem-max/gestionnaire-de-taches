import { Bell, ChevronRight, Plus, Search } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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

export function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)

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
        <div className="hidden w-64 items-center md:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              readOnly
              value=""
              placeholder={`Rechercher dans ${subtitle.toLowerCase()}`}
              className="h-8 border-border bg-background pl-8 text-sm shadow-none"
            />
          </div>
        </div>

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

        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" />
              Nouveau
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Création rapide</DialogTitle>
              <DialogDescription>
                Accès rapide aux actions de création depuis le header.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Fermer</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
            <DropdownMenuItem>Paramètres</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => void handleLogout()}>
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}





