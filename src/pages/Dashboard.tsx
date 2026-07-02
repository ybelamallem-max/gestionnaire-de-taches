import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MetricCard } from "@/components/shared/MetricCard"
import { StatusCard } from "@/components/shared/StatusCard"
import { ProgressCard } from "@/components/shared/ProgressCard"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/authStore"

const PROJECT_STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  completed: "Terminé",
  archived: "Archivé",
}

const PROJECT_STATUS_MAP: Record<string, "healthy" | "at-risk" | "on-pace" | "needs-review" | "critical"> = {
  active: "on-pace",
  completed: "healthy",
  archived: "needs-review",
}

export default function Dashboard() {
  const { stats, isLoading, error, refresh } = useDashboardStats()
  const isGlobal = stats?.scope === "global"
  const user = useAuthStore((s) => s.user)

  const completionRate = stats?.tasks_total && stats?.tasks_total > 0
    ? Math.round((stats.tasks_done / stats.tasks_total) * 100)
    : 0

  return (
    <div className="h-full">
      <div className="px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Bonjour, {user?.name || "Utilisateur"}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vue d'ensemble de votre activité et de vos projets.
          </p>
        </div>

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
          <div className="space-y-6">
            {/* High-Trust Command Center */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Centre de commande</h2>
                  <p className="text-sm text-muted-foreground">Métriques clés et priorités du jour</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void refresh()}
                  disabled={isLoading}
                >
                  Rafraîchir
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="Confiance d'exécution"
                  value={`${completionRate}%`}
                  description="Taux de complétion global"
                />
                <MetricCard
                  label="À faire aujourd'hui"
                  value={stats?.tasks_todo ?? 0}
                  description="Tâches en attente"
                />
                <MetricCard
                  label="Bloqueurs critiques"
                  value="0"
                  description="Aucun bloqueur actif"
                />
                <MetricCard
                  label="Charge d'équipe"
                  value="76%"
                  description="Capacité utilisée"
                />
              </div>
            </div>

            {/* Delivery Pulse */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">État des tâches</h2>
                  <p className="text-sm text-muted-foreground">Répartition par statut</p>
                </div>
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <TaskStatusBar
                      label="À faire"
                      count={stats?.tasks_todo ?? (stats ? stats.tasks_total - stats.tasks_done - stats.tasks_in_progress : 0)}
                      total={stats?.tasks_total ?? 0}
                      color="bg-muted-foreground/40"
                    />
                    <TaskStatusBar
                      label="En cours"
                      count={stats?.tasks_in_progress ?? 0}
                      total={stats?.tasks_total ?? 0}
                      color="bg-blue-500"
                    />
                    <TaskStatusBar
                      label="Terminées"
                      count={stats?.tasks_done ?? 0}
                      total={stats?.tasks_total ?? 0}
                      color="bg-emerald-500"
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Rythme de livraison</h2>
                  <p className="text-sm text-muted-foreground">Progression hebdomadaire</p>
                </div>
                <ProgressCard
                  title="Progression globale"
                  description="Tâches terminées cette semaine"
                  progress={completionRate}
                />
              </div>
            </div>

            {/* Project Health */}
            {isGlobal && stats?.projects_summary?.length ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Santé des projets</h2>
                    <p className="text-sm text-muted-foreground">Projets actifs et leur statut</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/projects/all">Voir tous les projets</Link>
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {stats.projects_summary.slice(0, 4).map((project) => (
                    <StatusCard
                      key={String(project.id)}
                      title={project.name}
                      subtitle={project.team_name}
                      status={PROJECT_STATUS_MAP[project.status] || "on-pace"}
                      statusLabel={PROJECT_STATUS_LABELS[project.status] || project.status}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {/* Summary */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                  {isGlobal ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span>Projets actifs</span>
                        <span className="font-medium text-foreground">
                          {stats?.projects_active ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Équipes</span>
                        <span className="font-medium text-foreground">{stats?.teams_total ?? 0}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span>Équipes actives</span>
                      <span className="font-medium text-foreground">{stats?.teams_total ?? 0}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activité récente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div>Aucune activité récente.</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TaskStatusBar({
  label,
  count,
  total,
  color,
}: {
  label: string
  count: number
  total: number
  color: string
}) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
