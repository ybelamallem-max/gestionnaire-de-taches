import { useState, useEffect } from "react"
import { Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "@/hooks/useTheme"
import { cn } from "@/lib/utils"

type NotificationPrefs = {
  team_invite: boolean
  team_accepted: boolean
  team_removed: boolean
  task_assigned: boolean
  comment_mention: boolean
  project_completed: boolean
  task_completed: boolean
}

const defaultNotificationPrefs: NotificationPrefs = {
  team_invite: true,
  team_accepted: true,
  team_removed: true,
  task_assigned: true,
  comment_mention: true,
  project_completed: true,
  task_completed: true,
}

const notificationLabels: Record<keyof NotificationPrefs, string> = {
  team_invite: "Invitation d'équipe",
  team_accepted: "Acceptation d'équipe",
  team_removed: "Retrait d'équipe",
  task_assigned: "Tâche assignée",
  comment_mention: "Mention dans un commentaire",
  project_completed: "Projet terminé",
  task_completed: "Tâche terminée",
}

export default function Settings() {
  const [language, setLanguage] = useState(() => 
    localStorage.getItem('app_language') || 'fr'
  )
  const { theme, setTheme } = useTheme()
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(() => {
    const saved = localStorage.getItem('notification_prefs')
    if (saved) {
      try {
        return JSON.parse(saved) as NotificationPrefs
      } catch {
        return defaultNotificationPrefs
      }
    }
    return defaultNotificationPrefs
  })

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)
    localStorage.setItem('app_language', lang)
  }

  const handleNotificationToggle = (key: keyof NotificationPrefs) => {
    const newPrefs = { ...notificationPrefs, [key]: !notificationPrefs[key] }
    setNotificationPrefs(newPrefs)
    localStorage.setItem('notification_prefs', JSON.stringify(newPrefs))
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Paramètres</h1>

      {/* Section Langue */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Langue</h2>
        <div className="flex gap-3">
          <button
            onClick={() => handleLanguageChange('fr')}
            className={cn(
              "px-4 py-2 rounded-md font-medium transition-colors",
              language === 'fr'
                ? "bg-primary text-primary-foreground"
                : "border border-input bg-background hover:bg-accent"
            )}
          >
            Français
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            className={cn(
              "px-4 py-2 rounded-md font-medium transition-colors",
              language === 'en'
                ? "bg-primary text-primary-foreground"
                : "border border-input bg-background hover:bg-accent"
            )}
          >
            English
          </button>
        </div>
      </section>

      {/* Section Thème */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Thème</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setTheme('light')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors",
              theme === 'light'
                ? "bg-primary text-primary-foreground"
                : "border border-input bg-background hover:bg-accent"
            )}
          >
            <Sun className="size-4" />
            Clair
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors",
              theme === 'dark'
                ? "bg-primary text-primary-foreground"
                : "border border-input bg-background hover:bg-accent"
            )}
          >
            <Moon className="size-4" />
            Sombre
          </button>
          <button
            onClick={() => setTheme('system')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors",
              theme === 'system'
                ? "bg-primary text-primary-foreground"
                : "border border-input bg-background hover:bg-accent"
            )}
          >
            <Monitor className="size-4" />
            Système
          </button>
        </div>
      </section>

      {/* Section Préférences de notifications */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Préférences de notifications</h2>
        <div className="space-y-3">
          {(Object.keys(notificationPrefs) as Array<keyof NotificationPrefs>).map((key) => (
            <div key={key} className="flex items-center justify-between p-3 border rounded-lg bg-background">
              <span className="text-sm">{notificationLabels[key]}</span>
              <button
                onClick={() => handleNotificationToggle(key)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  notificationPrefs[key] ? "bg-primary" : "bg-input"
                )}
              >
                <span
                  className={cn(
                    "inline-block size-4 transform rounded-full bg-background transition-transform",
                    notificationPrefs[key] ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
