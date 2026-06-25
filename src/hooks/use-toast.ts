import { useState } from "react"

export type Toast = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = (props: Toast) => {
    setToasts((prev) => [...prev, props])
    setTimeout(() => {
      setToasts((prev) => prev.slice(1))
    }, 3000)
  }

  return { toast, toasts }
}
