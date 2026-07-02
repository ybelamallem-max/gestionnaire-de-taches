import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusCardProps {
  title: string
  subtitle?: string
  status: "healthy" | "at-risk" | "on-pace" | "needs-review" | "critical"
  statusLabel?: string
  className?: string
}

const statusStyles = {
  healthy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "at-risk": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "on-pace": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  "needs-review": "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
}

const statusLabels = {
  healthy: "Healthy",
  "at-risk": "At risk",
  "on-pace": "On pace",
  "needs-review": "Needs review",
  critical: "Critical",
}

export function StatusCard({ title, subtitle, status, statusLabel, className }: StatusCardProps) {
  const label = statusLabel || statusLabels[status]

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="text-sm font-semibold">{title}</div>
              {subtitle && (
                <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
              )}
            </div>
            <Badge variant="outline" className={cn("shrink-0", statusStyles[status])}>
              {label}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
