"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export type Theme = "light" | "dark" | "system"
type ResolvedTheme = Exclude<Theme, "system">

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const storageKey = "tm_theme"

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return

  const resolved = resolveTheme(theme)
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(resolved)
  root.style.colorScheme = resolved
}

function disableTransitionsTemporarily() {
  if (typeof document === "undefined") return

  const style = document.createElement("style")
  style.appendChild(
    document.createTextNode("*{transition:none!important;animation:none!important;}")
  )

  document.head.appendChild(style)
  void window.getComputedStyle(document.body)

  window.setTimeout(() => {
    style.remove()
  }, 0)
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system"

  const stored = window.localStorage.getItem(storageKey)
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system"
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme())
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(readStoredTheme()))

  const setTheme = useCallback((value: Theme) => {
    disableTransitionsTemporarily()
    window.localStorage.setItem(storageKey, value)
    applyTheme(value)
    setThemeState(value)
    setResolvedTheme(resolveTheme(value))
  }, [])

  useEffect(() => {
    applyTheme(theme)
    setResolvedTheme(resolveTheme(theme))
  }, [theme])

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")

    const handleChange = () => {
      if (theme !== "system") return
      applyTheme("system")
      setResolvedTheme(getSystemTheme())
    }

    handleChange()
    media.addEventListener("change", handleChange)
    return () => media.removeEventListener("change", handleChange)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [resolvedTheme, setTheme, theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error("useTheme doit être utilisé dans ThemeProvider.")
  }

  return context
}
