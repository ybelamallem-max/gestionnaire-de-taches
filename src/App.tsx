import { AppLayout } from "@/components/layout/AppLayout"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { TooltipProvider } from "@/components/ui/tooltip"
import AdminUsers from "@/pages/Admin/Users"
import Dashboard from "@/pages/Dashboard"
import Login from "@/pages/Login"
import Notifications from "@/pages/Notifications"
import Projects from "@/pages/Projects"
import Tasks from "@/pages/Tasks"
import Teams from "@/pages/Teams"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

export default function App() {
  return (
    <TooltipProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="projects" element={<Projects />} />
                <Route path="teams" element={<Teams />} />
                <Route path="notifications" element={<Notifications />} />
                <Route element={<ProtectedRoute requiredRole="admin" />}>
                  <Route path="admin/users" element={<AdminUsers />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  )
}
