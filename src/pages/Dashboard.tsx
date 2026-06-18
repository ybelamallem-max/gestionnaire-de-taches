import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboardStats } from "@/hooks/useDashboardStats"

export default function Dashboard() {
  const { stats, isLoading, error, refresh } = useDashboardStats()

  return (
    <div className="h-full rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium text-zinc-100">Dashboard</div>
            <div className="text-xs text-zinc-400">Vue d’ensemble</div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-zinc-800 bg-zinc-950/40 text-zinc-100 hover:bg-zinc-900"
            onClick={() => void refresh()}
            disabled={isLoading}
          >
            Rafraîchir
          </Button>
        </div>

        {error ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-200">
            {error}
          </div>
        ) : null}

        {isLoading && !stats ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6 text-sm text-zinc-300">
            Chargement...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Tâches" value={stats?.tasks_total ?? 0} />
            <StatCard label="Terminées" value={stats?.tasks_done ?? 0} />
            <StatCard label="En cours" value={stats?.tasks_in_progress ?? 0} />
            <StatCard label="Équipes" value={stats?.teams_total ?? 0} />
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="bg-zinc-950/40 ring-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-zinc-100">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-zinc-100">{value}</div>
      </CardContent>
    </Card>
  )
}
