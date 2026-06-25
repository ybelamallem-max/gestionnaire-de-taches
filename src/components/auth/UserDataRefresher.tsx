import { useEffect } from "react"
import { useAuthStore } from "@/stores/authStore"
import { api } from "@/services/api"

export function UserDataRefresher() {
  const { user, token, setUser } = useAuthStore()

  useEffect(() => {
    // Refresh user data if logged in but tag is missing (stale data from before migration)
    if (token && user && !user.tag) {
      api
        .get("/me")
        .then((response) => {
          setUser(response.data.user)
        })
        .catch((error) => {
          console.error("Failed to refresh user data:", error)
        })
    }
  }, [token, user, setUser])

  return null
}
