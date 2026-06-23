import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { cn } from "@/lib/utils"

const PROJECT_STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  completed: "Terminé",
  archived: "Archivé",
}

export default function Dashboard() {
  const { stats, isLoading, error, refresh } = useDashboardStats()
  const isGlobal = stats?.scope === "global"

  return (
    <div className="h-full">
      <div className="page-header">
        <div>
          <div className="page-title">
            {isGlobal ? "Dashboard responsable" : "Dashboard"}
          </div>
          <div className="page-subtitle">
            {isGlobal
              ? "Vue d'ensemble de tous les projets et tâches"
              : "Vue d'ensemble"}
          </div>
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
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Tâches" value={stats?.tasks_total ?? 0} />
              <StatCard label="Terminées" value={stats?.tasks_done ?? 0} />
              <StatCard label="En cours" value={stats?.tasks_in_progress ?? 0} />
              {isGlobal ? (
                <StatCard label="Projets" value={stats?.projects_total ?? 0} />
              ) : (
                <StatCard label="Équipes" value={stats?.teams_total ?? 0} />
              )}
            </div>

            {isGlobal ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard label="Projets actifs" value={stats?.projects_active ?? 0} />
                <StatCard label="Projets terminés" value={stats?.projects_completed ?? 0} />
                <StatCard label="Tâches à faire" value={stats?.tasks_todo ?? 0} />
              </div>
            ) : null}

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
                  <CardTitle>État des tâches</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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

            {isGlobal && stats?.projects_summary?.length ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle>Suivi des projets</CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/projects/all">Voir tous les projets</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {stats.projects_summary.map((project) => (
                      <Link
                        key={String(project.id)}
                        to={`/projects/${project.id}`}
                        className="flex flex-col gap-2 py-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{project.name}</span>
                            <Badge variant="secondary">
                              {PROJECT_STATUS_LABELS[project.status] ?? project.status}
                            </Badge>
                          </div>
                          {project.team_name ? (
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {project.team_name}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex min-w-[180px] flex-col gap-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {project.tasks_done}/{project.tasks_total} tâches
                            </span>
                            <span>{project.progress_percent}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${project.progress_percent}%` }}
                            />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : !isGlobal ? (
              <Card>
                <CardHeader>
                  <CardTitle>Activité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div>Aucune activité récente.</div>
                </CardContent>
              </Card>
            ) : null}
          </>
        )}
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
    <div className="space-y-1">
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
