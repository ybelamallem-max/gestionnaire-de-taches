import type { AxiosError } from "axios"

export type ApiValidationErrors = Record<string, string[]>

export function getApiStatus(err: unknown): number | null {
  const status = (err as { response?: { status?: unknown } } | null)?.response?.status
  return typeof status === "number" ? status : null
}

export function getApiMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err && "response" in err) {
    const response = (err as { response?: { data?: { message?: unknown } } }).response
    if (typeof response?.data?.message === "string" && response.data.message.trim()) {
      return response.data.message
    }
  }

  if (typeof err === "object" && err && "message" in err) {
    const message = (err as { message?: unknown }).message
    if (typeof message === "string" && message.trim()) return message
  }

  return fallback
}

export function getValidationErrors(err: unknown): ApiValidationErrors | null {
  const axiosErr = err as AxiosError | null
  const status = axiosErr?.response?.status
  if (status !== 422) return null

  const data = axiosErr?.response?.data as { errors?: unknown } | undefined
  if (!data || typeof data !== "object") return null

  const errors = data.errors
  if (!errors || typeof errors !== "object") return null

  const record: ApiValidationErrors = {}
  for (const [key, value] of Object.entries(errors as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      record[key] = value.filter((v) => typeof v === "string") as string[]
    }
  }

  return record
}

