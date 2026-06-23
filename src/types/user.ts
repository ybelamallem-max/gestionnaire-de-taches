import type { AppRole } from "@/lib/roles"

export type AuthUser = {
  id?: string | number
  name?: string
  email?: string
  phone?: string
  birth_date?: string
  gender?: string
  avatar?: string
  role?: AppRole
}
