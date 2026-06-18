import { Navigate, Outlet } from "react-router-dom"

import { useAuthStore } from "@/stores/authStore"

type ProtectedRouteProps = {
  requiredRole?: "user" | "admin"
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)

  if (!token) return <Navigate to="/login" replace />
  if (requiredRole && user?.role !== requiredRole) return <Navigate to="/" replace />

  return <Outlet />
}
