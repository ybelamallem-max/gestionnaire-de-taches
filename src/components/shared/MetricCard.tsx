import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  label: string
  value: string | number
  description?: string
  trend?: "up" | "down" | "neutral"
  className?: string
}

export function MetricCard({ label, value, description, trend, className }: MetricCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-5">
        <div className="flex flex-col gap-1">
          <div className="text-sm font-medium text-muted-foreground">{label}</div>
          <div className="text-3xl font-semibold tracking-tight">{value}</div>
          {description && (
            <div className="text-xs text-muted-foreground">{description}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
