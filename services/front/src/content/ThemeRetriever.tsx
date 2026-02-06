import { useEffect } from 'react'

async function applyTheme(themeName: string) {
  console.log(`${themeName}.json`)
  try {
    const res = await fetch(`/themes/styles/${themeName}.json`)
    const themeToApply = await res.json()

    const root = document.documentElement
    Object.entries(themeToApply.variables).forEach(([key, value]) => {
      root.style.setProperty(key, value as string)
    })

  } catch (err) {
    console.error(`Erreur lors du chargement du thème "${themeName}"`, err)
    if (themeName !== 'default')
      return applyTheme('default')
    return
  }
}

async function applyFont(fontName: string) {
  console.log(`${fontName}.json`)
  try {
    const res = await fetch(`/themes/fonts/${fontName}.json`)
    const themeToApply = await res.json()

    const root = document.documentElement
    Object.entries(themeToApply.variables).forEach(([key, value]) => {
      root.style.setProperty(key, value as string)
    })

  } catch (err) {
    console.error(`Erreur lors du chargement du thème "${fontName}"`, err)
    if (fontName !== 'default')
      return applyFont('default')
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