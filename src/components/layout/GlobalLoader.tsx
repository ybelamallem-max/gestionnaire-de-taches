import { Spinner } from "@/components/ui/spinner"
import { useUiStore } from "@/stores/uiStore"
import { cn } from "@/lib/utils"

export function GlobalLoader() {
  const pending = useUiStore((s) => s.pendingRequests)

  return (
    <div
      className={cn(
        "pointer-events-none fixed left-0 right-0 top-2 z-[60] flex items-center justify-center transition-opacity",
        pending > 0 ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border bg-background/95 px-3 py-1.5 text-xs text-foreground shadow-md backdrop-blur">
        <Spinner className="size-3 border-muted-foreground border-t-foreground" />
        <span>Chargement…</span>
      </div>
    </div>
  )
}

