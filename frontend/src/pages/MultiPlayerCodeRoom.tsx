import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import '../App.css'

// Fonction qui va créer un code random pour la salle multi, j'ai enlever le 0 pour eviter les confusions, si ya d'autres lettres a enlever on peut le faire plus tard mais je pense c'est good
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}


// A voir avec le backend pour gerer plusieurs personnes plus tard, surtout que la bon la gestion est vraiment basique

function MultiPlayerCodeRoom() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { roomCode } = useParams()
  const [code, setCode] = useState<string>('')
  const [isHost, setIsHost] = useState(false)
  const [players, setPlayers] = useState<string[]>([])

  useEffect(() => {
    if (roomCode) {
      setCode(roomCode)
      setIsHost(false)
      setPlayers(['Joueur 1 (Hote)', 'Toi'])
    } else {
      const newCode = generateRoomCode()
      setCode(newCode)
      setIsHost(true)
      setPlayers(['Toi (Hote)'])
      navigate(`/quiz/multi/${newCode}`, { replace: true })
    }
  }, [roomCode, navigate])

  return (
    <main className="page">
      <div className="shell">
        <p className="eyebrow">Quiz Sprint - {t("create_room")}</p>
        <div className="hero">
          <div className="copy">
            <h1>{isHost ? t("room_title_host") : t("room_title_guest")}</h1>
            <div style={{ margin: '2rem 0', padding: '2rem', background: '#ffffffff', borderRadius: '8px', border: '2px solid #000000' }}>
              <p style={{ fontSize: '1.2rem', marginBottom: '0.9rem', color: '#cac9c9ff' }}>
                {t("room_code_label")}
              </p>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold', letterSpacing: '0.3em', margin: '0' }}>
                {code}
              </p>
            </div>
            <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{t("players_connected")}</p>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {players.map((player, index) => (
                  <li key={index} style={{ padding: '0.5rem', background: '#ffffffff', margin: '0.25rem 0' }}>
                    👤 {player}
                  </li>
                ))}
              </ul>
            </div>
            <p className="lede" style={{ color: '#cac9c9ff' }}>
              {isHost
                ? t("room_description_host")
                : t("room_description_guest")}
            </p>
            <div className="actions">
              {isHost && (
                <button className="btn primary">{t("start_game")}</button>
              )}
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

export default MultiPlayerCodeRoom
