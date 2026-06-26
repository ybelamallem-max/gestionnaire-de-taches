import { AppLayout } from "@/components/layout/AppLayout"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { UserDataRefresher } from "@/components/auth/UserDataRefresher"
import { TooltipProvider } from "@/components/ui/tooltip"
import AdminUsers from "@/pages/Admin/Users"
import Dashboard from "@/pages/Dashboard"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import Notifications from "@/pages/Notifications"
import Profile from "@/pages/Profile"
import ProjectDetail from "@/pages/ProjectDetail"
import Projects from "@/pages/Projects"
import Tasks from "@/pages/Tasks"
import Teams from "@/pages/Teams"
import Settings from "@/pages/Settings"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

export default function App() {
  return (
    <TooltipProvider>
      <ThemeProvider>
        <BrowserRouter>
          <UserDataRefresher />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="tasks" element={<Navigate to="/tasks/mine" replace />} />
                <Route path="tasks/me" element={<Tasks scope="me" />} />
                <Route path="tasks/mine" element={<Tasks scope="mine" />} />
                <Route path="tasks/team" element={<Tasks scope="team" />} />
                <Route path="tasks/all" element={<Tasks scope="all" />} />
                <Route path="projects" element={<Navigate to="/projects/me" replace />} />
                <Route path="projects/me" element={<Projects scope="me" />} />
                <Route path="projects/team" element={<Projects scope="team" />} />
                <Route path="projects/all" element={<Projects scope="all" />} />
                <Route path="projects/:id" element={<ProjectDetail />} />
                <Route path="teams" element={<Teams />} />
                <Route path="settings" element={<Settings />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="profile" element={<Profile />} />
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
