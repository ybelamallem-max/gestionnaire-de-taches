import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboardStats } from "@/hooks/useDashboardStats"

export default function Dashboard() {
  const { stats, isLoading, error, refresh } = useDashboardStats()

  return (
    <div className="h-full">
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Vue d’ensemble</div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void refresh()}
          disabled={isLoading}
        >
          Rafraîchir
        </Button>
      </div>

      <div className="page-section space-y-5">
        {error ? (
          <div className="panel-muted text-destructive">
            {error}
          </div>
        ) : null}

        {isLoading && !stats ? (
          <div className="empty-state">
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

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Résumé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Tâches ouvertes</span>
                <span className="font-medium text-foreground">
                  {(stats?.tasks_total ?? 0) - (stats?.tasks_done ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tâches terminées</span>
                <span className="font-medium text-foreground">{stats?.tasks_done ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Équipes actives</span>
                <span className="font-medium text-foreground">{stats?.teams_total ?? 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>Le tableau de bord reprend un rendu compact et neutre inspiré de Circle.</div>
              <div>Les indicateurs restent branchés sur les mêmes hooks et les mêmes données.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  )
}
