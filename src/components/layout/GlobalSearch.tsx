import { useState, useEffect, useRef } from "react"
import { Search } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { api } from "@/services/api"

interface SearchResult {
  tasks: Array<{ id: number; title: string; project?: { id: number; name: string } }>
  projects: Array<{ id: number; name: string; team?: { id: number; name: string } }>
  teams: Array<{ id: number; name: string }>
  users: Array<{ id: number; name: string; email: string; tag?: string }>
}

interface GlobalSearchProps {
  open: boolean
  onClose: () => void
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setQuery("")
      setResults(null)
    }
  }, [open])

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.length < 2) {
        setResults(null)
        return
      }

      setIsLoading(true)
      try {
        const response = await api.get<SearchResult>("/search", { params: { q: query } })
        setResults(response.data)
      } catch (error) {
        console.error("Search error:", error)
        setResults(null)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  if (!open) return null

  const hasResults = results && (
    (results.tasks && results.tasks.length > 0) ||
    (results.projects && results.projects.length > 0) ||
    (results.teams && results.teams.length > 0) ||
    (results.users && results.users.length > 0)
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm pt-[20%]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-lg border bg-popover p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Chargement...
          </div>
        )}

        {!isLoading && query.length >= 2 && !hasResults && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Aucun résultat pour "{query}"
          </div>
        )}

        {!isLoading && hasResults && results && (
          <div className="max-h-96 overflow-y-auto">
            {results.tasks && results.tasks.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Tâches</h3>
                {results.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      onClose()
                      navigate(`/tasks`)
                    }}
                    className="cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-accent"
                  >
                    <div className="font-medium">{task.title}</div>
                    {task.project && (
                      <div className="text-xs text-muted-foreground">{task.project.name}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {results.projects && results.projects.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Projets</h3>
                {results.projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => {
                      onClose()
                      navigate(`/projects/${project.id}`)
                    }}
                    className="cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-accent"
                  >
                    <div className="font-medium">{project.name}</div>
                    {project.team && (
                      <div className="text-xs text-muted-foreground">{project.team.name}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {results.teams && results.teams.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Équipes</h3>
                {results.teams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => {
                      onClose()
                      navigate(`/teams`)
                    }}
                    className="cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-accent"
                  >
                    <div className="font-medium">{team.name}</div>
                  </div>
                ))}
              </div>
            )}

            {results.users && results.users.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Utilisateurs</h3>
                {results.users.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-md px-3 py-2 text-sm"
                  >
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                    {user.tag && (
                      <div className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px]">
                        {user.tag}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
