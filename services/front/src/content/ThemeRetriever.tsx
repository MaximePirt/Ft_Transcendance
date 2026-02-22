import { useEffect } from 'react'

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
    console.error(`Erreur lors du chargement du thème "${themeName}"`, err)
    if (themeName !== 'default')
      return applyTheme('default', signal)
    return
  }
}

async function applyFont(fontName: string, signal?: AbortSignal) {
  try {
    const res = await fetch(`/themes/fonts/${fontName}.json`, { signal })
    const themeToApply = await res.json()

    const root = document.documentElement
    Object.entries(themeToApply.variables).forEach(([key, value]) => {
      root.style.setProperty(key, value as string)
    })

  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return
    console.error(`Erreur lors du chargement du thème "${fontName}"`, err)
    if (fontName !== 'default')
      return applyFont('default', signal)
    return
  }
}

const ThemeRetriever = () => {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'default'
    const savedFont = localStorage.getItem('font') || 'default'

    applyTheme(savedTheme)
    applyFont(savedFont)
  }, [])

    return null
}

export default ThemeRetriever;