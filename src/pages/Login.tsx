import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ArrowRight } from "lucide-react"

import { AuthShell } from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/button"
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { api } from "@/services/api"
import type { ApiValidationErrors } from "@/services/apiErrors"
import { getApiMessage, getValidationErrors } from "@/services/apiErrors"
import { useAuthStore } from "@/stores/authStore"
import { FieldError } from "@/components/ui/field-error"

type LoginResponse = {
  token?: string
  access_token?: string
  user?: { id?: string | number; name?: string; email?: string }
  data?: { token?: string; access_token?: string; user?: { id?: string | number; name?: string; email?: string } }
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<ApiValidationErrors | null>(null)

  useEffect(() => {
    const state = location.state as { email?: unknown } | null
    if (typeof state?.email === "string" && state.email.trim()) {
      setEmail(state.email)
    }
  }, [location.state])

  const isDisabled = useMemo(() => {
    return isLoading || !email.trim() || !password
  }, [email, isLoading, password])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors(null)
    setIsLoading(true)

    try {
      const res = await api.post<LoginResponse>("/login", { email, password })
      const token =
        res.data.token ??
        res.data.access_token ??
        res.data.data?.token ??
        res.data.data?.access_token

      if (!token) throw new Error("Token manquant dans la réponse.")

      const user = res.data.user ?? res.data.data?.user ?? { email }
      login(user, token)
      navigate("/", { replace: true })
    } catch (err: unknown) {
      const validation = getValidationErrors(err)
      if (validation) {
        setFieldErrors(validation)
      } else {
        setError(getApiMessage(err, "Erreur lors de la connexion."))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      title="Connexion"
      subtitle="Accès à votre espace de travail"
    >
      <CardHeader className="border-b bg-card/50">
        <CardTitle className="text-lg">Connexion</CardTitle>
        <CardDescription>
          Saisissez vos identifiants pour accéder à l’application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="rounded-lg border bg-background px-4 py-3 text-sm text-muted-foreground">
          Authentification sécurisée sur votre environnement métier.
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-medium text-muted-foreground"
            >
              Email
            </label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              type="email"
              autoComplete="email"
              className="h-10"
            />
            <FieldError errors={fieldErrors?.email} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-xs font-medium text-muted-foreground"
              >
                Mot de passe
              </label>
              <button
                type="button"
                className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Besoin d’aide ?
              </button>
            </div>
            <Input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
              className="h-10"
            />
            <FieldError errors={fieldErrors?.password} />
          </div>

          {error ? (
            <div className="panel-muted text-destructive">
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={isDisabled}
            className="h-10 w-full"
          >
            <span className="flex items-center justify-center gap-2">
              <span>{isLoading ? "Connexion..." : "Ouvrir la session"}</span>
              <ArrowRight className="size-4" />
            </span>
          </Button>
        </form>

        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>Accès réservé aux utilisateurs autorisés.</span>
          <span>Support interne</span>
        </div>
      </CardContent>
    </AuthShell>
  )
}
