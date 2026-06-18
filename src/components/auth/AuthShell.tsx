import { Link } from "react-router-dom"
import { CheckCircle2, Sparkles, Timer } from "lucide-react"
import type { ComponentType, ReactNode } from "react"

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
    <div className="relative min-h-dvh overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(63,63,70,0.28),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(63,63,70,0.18),transparent_55%)]" />

      <div className="relative mx-auto grid min-h-dvh max-w-5xl items-stretch px-4 py-10 md:grid-cols-2 md:gap-8">
        <div className="hidden md:flex">
          <div className="relative w-full overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(39,39,42,0.55),transparent_55%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(24,24,27,0.5),transparent_30%,rgba(9,9,11,1))]" />

            <div className="relative flex h-full flex-col p-7">
              <div className="flex items-center gap-3">
                <div className="relative size-11 rounded-2xl border border-zinc-800 bg-zinc-900/70">
                  <div className="absolute left-1/2 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-100" />
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-100">
                    Task Manager
                  </div>
                  <div className="text-sm text-zinc-400">
                    Interface sombre inspirée de Linear
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <div className="text-2xl font-semibold tracking-tight">
                  Une base UI propre, rapide et lisible.
                </div>
                <div className="mt-2 max-w-sm text-sm text-zinc-400">
                  Auth frontend uniquement, prêt à être connecté au backend.
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <Feature
                  title="Clair et dense"
                  description="Grille, espacements, contrastes et bordures subtiles."
                  icon={Sparkles}
                />
                <Feature
                  title="Prêt pour la prod"
                  description="Layouts cohérents, composants shadcn/ui, routing."
                  icon={CheckCircle2}
                />
                <Feature
                  title="Rapide"
                  description="Vite + React + Tailwind pour itérer sans friction."
                  icon={Timer}
                />
              </div>

              <div className="mt-auto pt-8 text-xs text-zinc-500">
                © {new Date().getFullYear()} Task Manager
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-full">
            <div className="mb-7 flex items-center justify-between">
              <div className="md:hidden">
                <div className="text-sm font-medium text-zinc-100">
                  Task Manager
                </div>
                <div className="text-sm text-zinc-400">{subtitle}</div>
              </div>

              <div className="hidden md:block">
                <div className="text-sm font-medium text-zinc-100">{title}</div>
                <div className="text-sm text-zinc-400">{subtitle}</div>
              </div>

              {switchLink ? (
                <Link
                  to={switchLink.to}
                  className="text-sm text-zinc-400 underline underline-offset-4 hover:text-zinc-100"
                >
                  {switchLink.label}
                </Link>
              ) : null}
            </div>

            <div className="relative rounded-3xl bg-gradient-to-b from-zinc-700/25 via-zinc-800/10 to-transparent p-[1px]">
              <div className="rounded-3xl border border-zinc-800/70 bg-zinc-900/55 shadow-[0_30px_80px_-45px_rgba(0,0,0,0.9)] backdrop-blur">
                {children}
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
    <div className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
      <div className="mt-0.5 flex size-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950">
        <Icon className={cn("size-4 text-zinc-200")} />
      </div>
      <div>
        <div className="text-sm font-medium text-zinc-100">{title}</div>
        <div className="mt-0.5 text-sm text-zinc-400">{description}</div>
      </div>
    </div>
  )
}
