import { useEffect, useState } from 'react'

const THEMES = [
  'default',
  'cinéma',
  'echec',
  'histoire',
  'informatique',
  'jeuxvidéo',
  'musiques',
  'sports',
] as const

async function applyTheme(themeName: string, signal?: AbortSignal) {
  try {
    const res = await fetch(`/themes/styles/${themeName}.json`, { signal })
    const themeToApply = await res.json()

    const root = document.documentElement
    Object.entries(themeToApply.variables).forEach(([key, value]) => {
      root.style.setProperty(key, value as string)
    })

  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return
    // console.error(`Erreur lors du chargement du thème "${themeName}"`, err)
    if (themeName !== 'default')
      return applyTheme('default', signal)
    return
  }
}

const ThemeSelector = () => {
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
      aria-label="theme"
    >
      {THEMES.map((themeName) => (
        <option key={themeName} value={themeName}>
          {themeName}
        </option>
      ))}
    </select>
  )
}

export default ThemeSelector;