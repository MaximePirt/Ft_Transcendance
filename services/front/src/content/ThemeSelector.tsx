import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const THEMES = [
  { id: 'default', labelKey: 'theme_default' },
  { id: 'cinéma', labelKey: 'cinema' },
  { id: 'echec', labelKey: 'chess' },
  { id: 'histoire', labelKey: 'histoire' },
  { id: 'informatique', labelKey: 'computer_science' },
  { id: 'jeuxvidéo', labelKey: 'video_games' },
  { id: 'musiques', labelKey: 'music' },
  { id: 'sports', labelKey: 'sports' },
] as const

async function applyTheme(themeName: string, signal?: AbortSignal, isRetry = false) {
  try {
    const res = await fetch(`/themes/styles/${themeName}.json`, { signal })
    if (!res.ok) {
      if (!isRetry && themeName !== 'default') {
        return applyTheme('default', signal, true)
      }
      return
    }

    const themeToApply = await res.json()

    const root = document.documentElement
    Object.entries(themeToApply.variables).forEach(([key, value]) => {
      root.style.setProperty(key, value as string)
    })

  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return
    if (!isRetry && themeName !== 'default') {
      return applyTheme('default', signal, true)
    }
    if (!isRetry && themeName !== 'default') {
      console.log(`Erreur lors du chargement du thème "${themeName}"`, err)
    }
    return
  }
}

const ThemeSelector = () => {
  const { t } = useTranslation()
  const [theme, setTheme] = useState<string>('default')

useEffect(() => {
  const controller = new AbortController();
  const savedTheme = localStorage.getItem('theme') || 'default';
  
  setTheme(savedTheme);
  applyTheme(savedTheme, controller.signal);

  return () => controller.abort();
  }, []);

  useEffect(() => {
    const handleThemeSync = () => {
      const savedTheme = localStorage.getItem('theme') || 'default'
      setTheme(savedTheme)
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== 'theme') return
      setTheme(e.newValue || 'default')
    }

    window.addEventListener('theme-font-reset', handleThemeSync)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener('theme-font-reset', handleThemeSync)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const handleThemeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedTheme = e.target.value
      localStorage.setItem('theme', selectedTheme)
      setTheme(selectedTheme)
      await applyTheme(selectedTheme)
  }

  return (
    <select
      className="theme-combobox"
      value={theme}
      onChange={handleThemeChange}
      aria-label={t('theme_selector_label')}
    >
      {THEMES.map((themeOption) => (
        <option key={themeOption.id} value={themeOption.id}>
          {t(themeOption.labelKey)}
        </option>
      ))}
    </select>
  )
}

export default ThemeSelector;