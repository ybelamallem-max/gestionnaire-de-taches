import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { api } from "@/services/api"
import type { ApiValidationErrors } from "@/services/apiErrors"
import { getApiMessage, getValidationErrors } from "@/services/apiErrors"
import { useAuthStore } from "@/stores/authStore"
import { FieldError } from "@/components/ui/field-error"

type RegisterResponse = {
  token?: string
  access_token?: string
  user?: { id?: string | number; name?: string; email?: string }
  data?: { token?: string; access_token?: string; user?: { id?: string | number; name?: string; email?: string } }
}

export default function Register() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<ApiValidationErrors | null>(null)

  const isDisabled = useMemo(() => {
    return isLoading || !name.trim() || !email.trim() || !password || !confirmPassword
  }, [name, email, password, confirmPassword, isLoading])

  const passwordMismatch = useMemo(() => {
    return confirmPassword && password !== confirmPassword
  }, [password, confirmPassword])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors(null)
    setIsLoading(true)

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      setIsLoading(false)
      return
    }

    try {
      const res = await api.post<RegisterResponse>("/register", {
        name,
        email,
        password,
      })
      const token =
        res.data.token ??
        res.data.access_token ??
        res.data.data?.token ??
        res.data.data?.access_token

      if (!token) throw new Error("Token manquant dans la réponse.")

      const user = res.data.user ?? res.data.data?.user ?? { email, name }
      login(user, token)
      navigate("/", { replace: true })
    } catch (err: unknown) {
      const validation = getValidationErrors(err)
      if (validation) {
        setFieldErrors(validation)
      } else {
        setError(getApiMessage(err, "Erreur lors de l'inscription."))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        {/* Left side - Register form */}
        <div className="flex w-full flex-col justify-center px-8 py-12 lg:w-1/2 lg:px-16">
          {/* Logo with theme toggle */}
          <div className="mb-12 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
                <div className="size-3 rounded-full bg-primary-foreground" />
              </div>
              <span className="text-xl font-semibold">Gestionnaire de tâches</span>
            </div>
            <ThemeToggle />
          </div>

          {/* Welcome text */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Créer un compte
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Rejoignez-nous pour gérer vos projets efficacement
            </p>
          </div>

          {/* Register form */}
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="text-xs font-medium text-muted-foreground"
              >
                Nom complet
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Entrez votre nom"
                type="text"
                autoComplete="name"
                className="h-11"
              />
              <FieldError errors={fieldErrors?.name} />
            </div>

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
                placeholder="Entrez votre adresse email"
                type="email"
                autoComplete="email"
                className="h-11"
              />
              <FieldError errors={fieldErrors?.email} />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-medium text-muted-foreground"
              >
                Mot de passe
              </label>
              <Input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                autoComplete="new-password"
                className="h-11"
              />
              <FieldError errors={fieldErrors?.password} />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="text-xs font-medium text-muted-foreground"
              >
                Confirmer le mot de passe
              </label>
              <Input
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                autoComplete="new-password"
                className="h-11"
              />
              {passwordMismatch ? (
                <p className="text-xs text-destructive">Les mots de passe ne correspondent pas.</p>
              ) : null}
            </div>

            {error ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={isDisabled || passwordMismatch}
              className="h-11 w-full"
            >
              <span className="flex items-center justify-center gap-2">
                <span>{isLoading ? "Inscription..." : "S'inscrire"}</span>
                <ArrowRight className="size-4" />
              </span>
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Déjà un compte ?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-medium text-primary hover:underline"
              >
                Se connecter
              </button>
            </div>
          </form>
        </div>

        {/* Right side - Decorative */}
        <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:px-16 lg:py-12">
          <div className="relative flex h-full flex-col justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-12 dark:from-blue-950/30 dark:to-blue-900/30">
            {/* Decorative elements */}
            <div className="absolute top-8 right-8 size-24 rounded-full bg-blue-200/50 blur-3xl dark:bg-blue-500/20" />
            <div className="absolute bottom-8 left-8 size-32 rounded-full bg-blue-300/50 blur-3xl dark:bg-blue-400/20" />

            {/* Sofimed branding */}
            <div className="relative z-10 mx-auto max-w-md text-center">
              <div className="mb-8">
                <h2 className="text-5xl font-bold text-foreground">Sofimed</h2>
                <p className="mt-4 text-xl text-muted-foreground">
                  Société de Fournitures Industrielles de la Méditerranée
                </p>
              </div>

              <div className="rounded-2xl  bg-white/90 p-8 shadow-xl backdrop-blur-sm dark:border-indigo-700/50 dark:bg-slate-800/90">
                <p className="text-lg font-medium text-foreground">
                  Gestionnaire de tâches
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Optimisez votre productivité
                </p>
              </div>
            </div>

            {/* Bottom text */}
            <div className="relative z-10 mt-12 text-center">
              <p className="text-sm text-muted-foreground">
                Une interface moderne pour gérer vos projets
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
