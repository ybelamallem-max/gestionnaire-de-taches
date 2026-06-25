import type { AuthUser } from "@/types/user"

export function formatDisplayName(user: AuthUser | null | undefined): string {
  if (!user?.name) return "Utilisateur"
  const tag = user.tag ? String(user.tag).padStart(3, "0") : "000"
  return `${user.name}#${tag}`
}

export function getAvatarInitials(user: AuthUser | null | undefined): string {
  if (!user) return "TM"
  const name = user.name || user.email || "TM"
  return name.slice(0, 2).toUpperCase()
}
