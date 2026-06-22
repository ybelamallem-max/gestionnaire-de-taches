import { Component, type ErrorInfo, type ReactNode } from "react"

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erreur React:", error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
          <div className="max-w-lg rounded-lg border bg-card p-6 shadow-xs">
            <h1 className="text-lg font-semibold">L&apos;application a rencontré une erreur</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {this.state.error.message || "Erreur inconnue"}
            </p>
            <button
              type="button"
              className="mt-4 rounded-md border px-3 py-2 text-sm hover:bg-accent"
              onClick={() => window.location.reload()}
            >
              Recharger la page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
