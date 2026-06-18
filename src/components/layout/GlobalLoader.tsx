import { Spinner } from "@/components/ui/spinner"
import { useUiStore } from "@/stores/uiStore"
import { cn } from "@/lib/utils"

export function GlobalLoader() {
  const pending = useUiStore((s) => s.pendingRequests)

  return (
    <div
      className={cn(
        "pointer-events-none fixed left-0 right-0 top-0 z-[60] flex items-center justify-center py-2 transition-opacity",
        pending > 0 ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/90 px-3 py-1 text-xs text-zinc-200 shadow-lg">
        <Spinner className="size-3 border-zinc-500 border-t-zinc-100" />
        <span>Chargement…</span>
      </div>
    </div>
  )
}

