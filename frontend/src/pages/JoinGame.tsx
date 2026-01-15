import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import '../App.css'

function JoinGame() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')

  const handleJoin = () => {
    if (roomCode.trim().length !== 6) {
      setError(t('code_error'))
      return
    }
    // Rejoindre la room avec le code
    navigate(`/quiz/multi/${roomCode.toUpperCase()}`)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z1-9]/g, '')
    if (value.length <= 6) {
      setRoomCode(value)
      setError('')
    }
  }

  return (
    <main className="page">
      <div className="shell">
        <p className="eyebrow">Quiz Sprint - {t("join_room")}</p>
        <div className="hero">
          <div className="copy">
            <h1>{t("join_title")}</h1>
            <p className="lede">{t("join_description")}</p>

            <div style={{ margin: '2rem 0' }}>
              <input
                type="text"
                value={roomCode}
                onChange={handleInputChange}
                placeholder={t("code_placeholder")}
                maxLength={6}
                style={{
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                  padding: 'clamp(0.75rem, 2vw, 1rem)',
                  textAlign: 'center',
                  letterSpacing: '0.3em',
                  width: '100%',
                  maxWidth: '400px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  textTransform: 'uppercase',
                  /*ici pour mettre une box/card de couleurs autour du bouton de code*/
                  backgroundColor: '#ffffffff',
                  /*texte*/
                  color: '#080808ff'
                }}
              />
              {error && (
                <p style={{ color: 'red', marginTop: '0.5rem', fontSize: 'clamp(0.8rem, 1.5vw, 0.9rem)' }}>
                  ⚠️ {error}
                </p>
              )}
            </div>

            <div className="actions">
              <button
                className="btn primary"
                onClick={handleJoin}
                disabled={roomCode.length !== 6}
              >
                {t("join_game")}
              </button>
              <button className="btn ghost" onClick={() => navigate('/quiz')}>
                {t("back")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default JoinGame
