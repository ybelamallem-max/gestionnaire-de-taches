import { create } from "zustand"

export type AuthUser = {
  id?: string | number
  name?: string
  email?: string
  phone?: string
  birth_date?: string
  gender?: string
  avatar?: string
  role?: "user" | "admin"
}

type AuthState = {
  user: AuthUser | null
  token: string | null
  login: (user: AuthUser | null, token: string) => void
  logout: () => void
}

const storageKey = "tm_auth"

function readStoredAuth(): Pick<AuthState, "user" | "token"> {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return { user: null, token: null }
    const parsed = JSON.parse(raw) as { user?: AuthUser; token?: string }
    return { user: parsed.user ?? null, token: parsed.token ?? null }
  } catch {
    return { user: null, token: null }
  }
}

function writeStoredAuth(payload: { user: AuthUser | null; token: string | null }) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(payload))
  } catch {
    return
  }
}

const initialAuth = typeof window === "undefined" ? { user: null, token: null } : readStoredAuth()

export const useAuthStore = create<AuthState>((set) => ({
  user: initialAuth.user,
  token: initialAuth.token,
  login: (user, token) => {
    writeStoredAuth({ user, token })
    set({ user, token })
  },
  logout: () => {
    writeStoredAuth({ user: null, token: null })
    set({ user: null, token: null })
  },
}))
