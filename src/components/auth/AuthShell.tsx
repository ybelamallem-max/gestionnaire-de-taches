import { Link } from "react-router-dom"
import { BriefcaseBusiness, KeyRound, ShieldCheck } from "lucide-react"
import type { ComponentType, ReactNode } from "react"

import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { cn } from "@/lib/utils"

type AuthShellProps = {
  title: string
  subtitle: string
  switchLink?: { to: string; label: string }
  children: ReactNode
}

export function AuthShell({
  title,
  subtitle,
  switchLink,
  children,
}: AuthShellProps) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md border bg-card">
              <div className="size-2 rounded-full bg-foreground/80" />
            </div>
            <div>
              <div className="text-sm font-semibold">Gestionnaire de tâches</div>
              <div className="text-xs text-muted-foreground">{subtitle}</div>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="grid w-full max-w-6xl items-stretch gap-6 lg:grid-cols-[minmax(0,1.2fr)_460px]">
            <div className="hidden lg:flex">
              <div className="flex w-full flex-col rounded-lg border bg-container shadow-xs">
                <div className="page-header-compact border-b">
                  <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                    <span>Portail</span>
                    <span>/</span>
                    <span className="font-medium text-foreground">Accès sécurisé</span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="max-w-xl">
                    <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Gestion interne
                    </div>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                      Accès à l’espace de travail
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      Connectez-vous pour retrouver vos tâches, vos projets, vos équipes et vos notifications
                      dans une interface unifiée.
                    </p>
                  </div>

                  <div className="mt-8 grid gap-4 xl:grid-cols-3">
                    <Feature
                      title="Organisation"
                      description="Suivi centralisé des tâches, équipes et projets."
                      icon={BriefcaseBusiness}
                    />
                    <Feature
                      title="Sécurité"
                      description="Accès réservé aux comptes autorisés de l’application."
                      icon={ShieldCheck}
                    />
                    <Feature
                      title="Connexion"
                      description="Authentification directe sur votre backend Laravel."
                      icon={KeyRound}
                    />
                    </div>

                  <div className="mt-8 rounded-lg border bg-card p-5 shadow-xs">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold">Environnement de travail</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          Utilisez vos identifiants professionnels pour accéder à votre espace.
                        </div>
                      </div>
                      <div className="hidden rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground xl:block">
                        Support interne
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                      <div className="rounded-md border bg-background px-4 py-3">
                        Vue dédiée au suivi quotidien et à la coordination des équipes.
                      </div>
                      <div className="rounded-md border bg-background px-4 py-3">
                        Interface sobre, cohérente avec le reste de l’application.
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-8 text-xs text-muted-foreground">
                    © {new Date().getFullYear()} Gestionnaire de tâches
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-full max-w-xl">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{title}</div>
                    <div className="text-sm text-muted-foreground">{subtitle}</div>
                  </div>

                  {switchLink ? (
                    <Link
                      to={switchLink.to}
                      className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    >
                      {switchLink.label}
                    </Link>
                  ) : null}
                </div>

                <div className="rounded-lg border bg-card shadow-xs">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Feature({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-4 shadow-xs">
      <div className="mt-0.5 flex size-8 items-center justify-center rounded-md border bg-background">
        <Icon className={cn("size-4 text-foreground")} />
      </div>
      <div>
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="mt-0.5 text-sm text-muted-foreground">{description}</div>
      </div>
    </div>
  )
}
