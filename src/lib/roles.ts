export type AppRole = "user" | "admin" | "responsable"

export function isResponsable(role?: AppRole | string | null): boolean {
  return role === "responsable"
}

export function canViewAll(role?: AppRole | string | null): boolean {
  return role === "responsable" || role === "admin"
}
