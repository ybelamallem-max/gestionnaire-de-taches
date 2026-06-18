import { Header } from "@/components/layout/Header"
import { GlobalLoader } from "@/components/layout/GlobalLoader"
import { Sidebar } from "@/components/layout/Sidebar"
import { Outlet } from "react-router-dom"

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <GlobalLoader />
      <div className="flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 p-4">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
