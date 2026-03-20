import { useEffect } from 'react'

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

async function applyFont(fontName: string, signal?: AbortSignal, isRetry = false) {
  try {
    const res = await fetch(`/themes/fonts/${fontName}.json`, { signal })
    if (!res.ok) {
      if (!isRetry && fontName !== 'default') {
        return applyFont('default', signal, true)
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
    if (!isRetry && fontName !== 'default') {
      return applyFont('default', signal, true)
    }
    if (!isRetry && fontName !== 'default') {
      console.log(`Erreur lors du chargement de la police "${fontName}"`, err)
    }
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