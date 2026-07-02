import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ProgressCardProps {
  title: string
  description?: string
  progress: number
  className?: string
}

export function ProgressCard({ title, description, progress, className }: ProgressCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-5">
        <div className="flex flex-col gap-3">
          <div>
            <div className="text-sm font-semibold">{title}</div>
            {description && (
              <div className="mt-1 text-xs text-muted-foreground">{description}</div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-muted stroke-current opacity-20"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${progress}, 100`}
                  className="text-primary stroke-current"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                {progress}%
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
