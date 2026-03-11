import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'

import '../App.css'

function JoinGame() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const { user, isAuthenticated, isAuthReady } = useAuth()
  

  const STORAGE_KEY = 'soloGameState:v1'


  const handleJoin = async () => {
    if (roomCode.trim().length !== 6) {
      setError(t('code_error'))
      return
    }
    try {
      if (!isAuthReady)
      {
        console.log("Auth not ready yet, waiting...")
        return
      }
      if (!isAuthenticated) {
        console.log("User not authenticated, redirecting to home")
        navigate('/')
        return
      }
      localStorage.removeItem("questionCount");
      localStorage.removeItem("sessionId");
      localStorage.removeItem(STORAGE_KEY);
      const checkcode = await fetch(`https://localhost/api/quiz/game-sessions/code/${roomCode}`)
      if (!checkcode.ok) {
        throw new Error('Game session not found')
      }
      const checkCodeJson = await checkcode.json()
      const session = checkCodeJson.sessionData
      const res = await fetch('https://localhost/api/quiz/game-sessions/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: roomCode.trim() })
      })
      .then(res => {
        if (res.ok) {
          localStorage.setItem("sessionId", String(session.id));
          localStorage.setItem("sessionCode", String(roomCode));
          navigate(`/quiz/multi`)
        } else {
          setError(t('join_error'))
        }
      })
    }
    catch (err) {
      setError(t('join_error'))
      return
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (value.length <= 6) {
      setRoomCode(value)
      setError('')
    }
  }

  useEffect(() => {
	; (async () => {
    try {
      if (!isAuthReady)
      {
        console.log("Auth not ready yet, waiting...")
        return
      }
      if (!isAuthenticated) {
        console.log("User not authenticated, redirecting to home")
        navigate('/')
        return
      }
    }
    catch(err)
    {
      console.error('Error in MultiPlayerCodeRoom:', err)
      setError(t("An error occurred while setting up the room. Please try again Later"))
    }
    finally {
      setLoading(false)
    }
    })()
}, [navigate, isAuthenticated, isAuthReady])

if (loading) {
	return (
		<main className="page">
		<div className="shell">
			<p className="eyebrow">Quiz Sprint</p>
			<div className="hero">
			<div className="copy">
				<h1>Chargement...</h1>
				<p className="lede">Préparation de la room.</p>
			</div>
			</div>
		</div>
		</main>
	)
}

if (error) {
	return (
		<main className="page">
		<div className="shell">
			<p className="eyebrow">Quiz Sprint</p>
			<div className="hero">
			<div className="copy">
				<h1>Erreur</h1>
				<p className="lede">{error}</p>
				<div className="actions">
					<button className="btn ghost" onClick={() => navigate('/quiz')}>
					{t("leave_room")}
					</button>
				</div>
			</div>
			</div>
		</div>
		</main>
	)
}

  return (
    <main className="page">
      <div className="shell">
        <p className="eyebrow">Quiz Sprint - {t("join_room")}</p>
        <div className="hero">
          <div className="copy">
            <h1>{t("join_title")}</h1>
            <p className="lede">{t("join_description")}</p>
            <div className="actions">
              <button className="btn ghost" onClick={() => navigate('/quiz')}>
                {t("back")}
              </button>
            </div>
          </div>
        </div>

				<div style={{ marginTop: '2rem', textAlign: 'center' }}>
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
							border: '2px solid #000000',
							borderRadius: '8px',
							textTransform: 'uppercase',
							backgroundColor: '#ffffffff',
							color: '#080808ff',
						}}
					/>
					{error && (
						<p style={{ color: 'red', marginTop: '0.5rem', fontSize: 'clamp(0.8rem, 1.5vw, 0.9rem)' }}>
							⚠️ {error}
						</p>
					)}
				</div>

				<div style={{ marginTop: '2rem', textAlign: 'center' }}>
					<button
						className="btn primary"
						onClick={handleJoin}
						disabled={roomCode.length !== 6}
						style={{
							opacity: roomCode.length === 6 ? 1 : 0.5,
							cursor: roomCode.length === 6 ? 'pointer' : 'not-allowed',
						}}
					>
						{t("join_game")}
					</button>
				</div>
			</div>
		</main>
	)
}

export default JoinGame
