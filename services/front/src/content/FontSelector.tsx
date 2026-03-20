import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const FONTS = [
  { id: 'default', labelKey: 'font_default' },
  { id: 'classic', labelKey: 'font_classic' },
  { id: 'round', labelKey: 'font_round' },
  { id: 'geometrical', labelKey: 'font_geometrical' },
] as const

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

const FontSelector = () => {
  const { t } = useTranslation()
  const [font, setFont] = useState<string>('default')

  useEffect(() => {
    const savedFont = localStorage.getItem('font') || 'default'
    setFont(savedFont)
    applyFont(savedFont)
  }, [])

  useEffect(() => {
    const handleFontSync = () => {
      const savedFont = localStorage.getItem('font') || 'default'
      setFont(savedFont)
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== 'font') return
      setFont(e.newValue || 'default')
    }

    window.addEventListener('theme-font-reset', handleFontSync)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener('theme-font-reset', handleFontSync)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const handleFontChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedFont = e.target.value
      localStorage.setItem('font', selectedFont)
      setFont(selectedFont)
      await applyFont(selectedFont)
  }

  return (
    <select
      className="font-combobox"
      value={font}
      onChange={handleFontChange}
      aria-label={t('font_selector_label')}
    >
      {FONTS.map((fontOption) => (
        <option key={fontOption.id} value={fontOption.id}>
          {t(fontOption.labelKey)}
        </option>
      ))}
    </select>
  )
}

export default FontSelector;