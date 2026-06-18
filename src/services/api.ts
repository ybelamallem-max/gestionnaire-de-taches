import axios, { AxiosHeaders } from "axios"

import { useAuthStore } from "@/stores/authStore"
import { useUiStore } from "@/stores/uiStore"

function getBaseUrl() {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000"
  const cleaned = raw.replace(/\/$/, "")
  if (cleaned.endsWith("/api")) return cleaned
  return cleaned + "/api"
}

export const api = axios.create({
  baseURL: getBaseUrl(),
})

api.interceptors.request.use((config) => {
  useUiStore.getState().startRequest()

  const token = useAuthStore.getState().token
  if (token) {
    config.headers = config.headers ?? new AxiosHeaders()
    config.headers.set("Authorization", `Bearer ${token}`)
  }
  return config
})

api.interceptors.response.use(
  (res) => {
    useUiStore.getState().endRequest()
    return res
  },
  (error) => {
    useUiStore.getState().endRequest()

    const status = error?.response?.status
    if (status === 401) {
      useAuthStore.getState().logout()
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login")
      }
    }

    return Promise.reject(error)
  }
)
