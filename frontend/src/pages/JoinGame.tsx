import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'

function JoinGame() {
  const navigate = useNavigate()
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')

  const handleJoin = () => {
    if (roomCode.trim().length !== 6) {
      setError('Le code doit contenir 6 caracteres')
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
        <p className="eyebrow">Quiz Sprint - Rejoindre une partie</p>
        <div className="hero">
          <div className="copy">
            <h1>Entre le code de la salle</h1>
            <p className="lede">Demande le code à ton ami qui a créé la partie</p>

            <div style={{ margin: '2rem 0' }}>
              <input
                type="text"
                value={roomCode}
                onChange={handleInputChange}
                placeholder="Ex: ABC123"
                maxLength={6}
                style={{
                  fontSize: '2rem',
                  padding: '1rem',
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
                <p style={{ color: 'red', marginTop: '0.5rem', fontSize: '0.9rem' }}>
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
                Rejoindre la partie
              </button>
              <button className="btn ghost" onClick={() => navigate('/quiz')}>
                Retour
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default JoinGame
