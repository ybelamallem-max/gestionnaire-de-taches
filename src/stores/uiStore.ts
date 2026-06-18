import { create } from "zustand"

type UiState = {
  pendingRequests: number
  startRequest: () => void
  endRequest: () => void
}

export const useUiStore = create<UiState>((set) => ({
  pendingRequests: 0,
  startRequest: () => set((s) => ({ pendingRequests: s.pendingRequests + 1 })),
  endRequest: () =>
    set((s) => ({ pendingRequests: Math.max(0, s.pendingRequests - 1) })),
}))

