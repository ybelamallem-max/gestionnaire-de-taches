import { Bell, Plus, Search } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import { api } from "@/services/api"
import { useAuthStore } from "@/stores/authStore"

export function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

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
    <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950/70 px-4 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-zinc-100">
            {title}
          </div>
          <div className="truncate text-xs text-zinc-400">
            {subtitle}
          </div>
        </div>
        <Badge variant="secondary" className="bg-zinc-800/80 text-zinc-100">
          Alpha
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
        >
          <Search />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
          onClick={() => navigate("/notifications")}
        >
          <Bell />
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-zinc-100 text-zinc-950 hover:bg-zinc-100/90">
              <Plus />
              Nouveau
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 text-zinc-100 ring-zinc-800">
            <DialogHeader>
              <DialogTitle>Création rapide</DialogTitle>
              <DialogDescription>
                Placeholder UI. Les formulaires et la logique viendront plus tard.
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
              className="rounded-full ring-offset-zinc-950 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-700 focus-visible:ring-offset-2"
            >
              <Avatar className="size-8">
                <AvatarFallback>TM</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profil</DropdownMenuItem>
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
