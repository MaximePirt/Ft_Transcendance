import { useEffect, useState } from 'react'

const FONTS = [
  'default',
  'classic',
  'round',
  'geometrical',
] as const

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

const FontSelector = () => {
  const [font, setFont] = useState<string>('default')

  useEffect(() => {
    const savedFont = localStorage.getItem('font') || 'default'
    setFont(savedFont)
    applyFont(savedFont)
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
      aria-label="font"
    >
      {FONTS.map((fontName) => (
        <option key={fontName} value={fontName}>
          {fontName}
        </option>
      ))}
    </select>
  )
}

export default FontSelector;