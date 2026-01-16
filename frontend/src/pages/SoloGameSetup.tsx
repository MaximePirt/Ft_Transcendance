import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import '../App.css'

const themes = (t: any) => [
  { id: 'All', title: t('all', { defaultValue: 'Tous' }), detail: t('all_desc', { defaultValue: '' }), icon: '' },
  { id: 'Histoire', title: t('histoire', { defaultValue: 'Histoire' }), detail: t('histoire_desc', { defaultValue: '' }), icon: '' },
  { id: 'Musiques', title: t('music', { defaultValue: 'Musiques' }), detail: t('music_desc', { defaultValue: '' }), icon: '' },
  { id: 'Sports', title: t('sports', { defaultValue: 'Sports' }), detail: t('sports_desc', { defaultValue: '' }), icon: '' },
  { id: 'Cinéma', title: t('cinema', { defaultValue: 'Cinéma' }), detail: t('cinema_desc', { defaultValue: '' }), icon: '' },
  { id: 'Jeux vidéo', title: t('video_games', { defaultValue: 'Jeux vidéo' }), detail: t('video_games_desc', { defaultValue: '' }), icon: '' },
  { id: 'Echec', title: t('chess', { defaultValue: 'Echec' }), detail: t('chess_desc', { defaultValue: '' }), icon: '' },
  { id: 'Informatique', title: t('Informatique', { defaultValue: 'Informatique' }), detail: t('Informatique_desc', { defaultValue: '' }), icon: '' }
]

function SoloGameSetup() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set())
  const [showThemesCard, setShowThemesCard] = useState(false)
  const themeList = themes(t)
  const themeIds = themeList.filter((theme) => theme.id !== 'All').map((theme) => theme.id)

  const handleThemeToggle = (themeId: string) => {
    if (themeId === 'All') {
      if (selectedThemes.has('All')) {
        setSelectedThemes(new Set())
      } else {
        setSelectedThemes(new Set(['All', ...themeIds]))
      }
      return
    }

    const newSelected = new Set(selectedThemes)
    if (newSelected.has(themeId)) {
      newSelected.delete(themeId)
    } else {
      newSelected.add(themeId)
    }

    const allSelected = themeIds.every((id) => newSelected.has(id))
    if (allSelected) {
      newSelected.add('All')
    } else {
      newSelected.delete('All')
    }

    setSelectedThemes(newSelected)
  }

  const handleStartGame = () => {
    if (selectedThemes.size > 0) {
      navigate('/quiz/solo', { state: { themes: Array.from(selectedThemes) } })
    }
  }

  return (
    <main className="page">
      <div className="shell">
        <p className="eyebrow">Quiz Sprint - {t("solo_mode")}</p>
        <div className="hero">
          <div className="copy">
            <h1>{t("select_theme")}</h1>
            <p className="lede">{t("choose_theme_description")}</p>
            <div className="actions">
              <button
                className="btn ghost"
                onClick={() => navigate('/quiz')}
              >
                {t("back")}
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            className="btn primary"
            onClick={() => setShowThemesCard(!showThemesCard)}
          >
            {selectedThemes.size > 0 
              ? `${selectedThemes.size} ${t('themes_selected', { defaultValue: 'thème(s) sélectionné(s)' })}` 
              : t('choose_themes', { defaultValue: '' })}
          </button>
        </div>

        {showThemesCard && (
          <div style={{
            marginTop: '2rem',
            padding: 'clamp(1rem, 3vw, 2rem)',
            backgroundColor: '#ffffffff',
            border: '2px solid #000000',
            borderRadius: '8px',
            boxShadow: '4px 4px 0px #000000',
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)' }}>{t("available_themes")}</h3>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
            }}>
              {themes(t).map((theme) => (
                <label
                  key={theme.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'clamp(0.75rem, 2vw, 1rem)',
                    backgroundColor: '#f9f9f9',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                >
                  {theme.id === 'Histoire' && (
                    <img
                      src={selectedThemes.has('Histoire') ? '/theme-icokns/Histoire.gif' : '/theme-icons/Histoire.png'}
                      alt="Histoire"
                      style={{
                        marginRight: '1rem',
                        width: '64px',
                        height: '64px',
                        imageRendering: 'pixelated',
                        flexShrink: 0,
                      }}
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement
                        if (img.src.endsWith('/Histoire.gif')) {
                          img.src = '/Histoire.png'
                        }
                      }}
                    />
                  )}
                  <input
                    type="checkbox"
                    checked={selectedThemes.has(theme.id)}
                    onChange={() => handleThemeToggle(theme.id)}
                    style={{
                      marginRight: '1rem',
                      cursor: 'pointer',
                      width: '20px',
                      height: '20px',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ width: '100%' }}>
                    <div style={{ fontWeight: 'bold', fontSize: 'clamp(14px, 2vw, 16px)' }}>{theme.title}</div>
                    <div style={{ fontSize: 'clamp(12px, 1.5vw, 14px)', color: '#666' }}>{theme.detail}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            className="btn primary"
            onClick={handleStartGame}
            disabled={selectedThemes.size === 0}
            style={{
              opacity: selectedThemes.size > 0 ? 1 : 0.5,
              cursor: selectedThemes.size > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            {t("start_game")}
          </button>
        </div>
      </div>
    </main>
  )
}

export default SoloGameSetup
