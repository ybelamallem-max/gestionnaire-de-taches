import { Header } from "@/components/layout/Header"
import { GlobalLoader } from "@/components/layout/GlobalLoader"
import { Sidebar } from "@/components/layout/Sidebar"
import { Outlet } from "react-router-dom"

export function AppLayout() {
  return (
    <div className="app-shell w-full">
      <GlobalLoader />
      <div className="app-shell w-full">
        <Sidebar />
        <div className="app-main">
          <div className="app-panel">
            <Header />
            <main className="page-scroll">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
