export const THEME_STORAGE_KEY = 'theme'

export type Theme = 'light' | 'dark'

const listeners = new Set<() => void>()

export function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
  } catch {
    // localStorage may be unavailable
  }
  return null
}

export function getResolvedTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme()
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function notifyThemeListeners() {
  listeners.forEach((listener) => listener())
}

/** Subscribe to theme changes for useSyncExternalStore. */
export function subscribeTheme(onStoreChange: () => void) {
  listeners.add(onStoreChange)

  const media = window.matchMedia('(prefers-color-scheme: dark)')
  function onSystemChange() {
    if (getStoredTheme() !== null) {
      return
    }
    applyTheme(getSystemTheme())
    onStoreChange()
  }
  media.addEventListener('change', onSystemChange)

  return () => {
    listeners.delete(onStoreChange)
    media.removeEventListener('change', onSystemChange)
  }
}

export function getServerThemeSnapshot(): Theme {
  return 'light'
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // localStorage may be unavailable
  }
  applyTheme(theme)
  notifyThemeListeners()
}

/** Blocking script: apply theme before first paint (no cookies). */
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`
