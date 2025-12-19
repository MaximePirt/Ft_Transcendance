import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../App.css'

// Fonction qui va créer un code random pour la salle multi, j'ai enlever le 0 pour eviter les confusions, si ya d'autres lettres a enlever on peut le faire
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

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(code)
    alert('Code copie dans le presse-papiers !')
  }

  return (
    <main className="page">
      <div className="shell">
        <p className="eyebrow">Quiz Sprint - Multijoueur</p>
        <div className="hero">
          <div className="copy">
            <h1>{isHost ? 'Ta salle est creee !' : 'Salle rejointe !'}</h1>
            <div style={{ margin: '2rem 0', padding: '2rem', background: '#000000ff', borderRadius: '8px' }}>
              <p style={{ fontSize: '1.2rem', marginBottom: '0.9rem', color: '#cac9c9ff' }}>
                Code de la salle :
              </p>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold', letterSpacing: '0.3em', margin: '0' }}>
                {code}
              </p>
              {isHost && (
                <button 
                  className="btn ghost" 
                  onClick={copyCodeToClipboard}
                  style={{ marginTop: '1rem', fontSize: '0.9rem' }}
                >
                  📋 Copier le code
                </button>
              )}
            </div>
            <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Joueurs connectés :</p>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {players.map((player, index) => (
                  <li key={index} style={{ padding: '0.5rem', background: '#000000ff', margin: '0.25rem 0', borderRadius: '4px' }}>
                    👤 {player}
                  </li>
                ))}
              </ul>
            </div>
            <p className="lede" style={{ color: '#cac9c9ff' }}>
              {isHost 
                ? 'Partage le code ci-dessus avec tes amis pour qu\'ils puissent rejoindre !'
                : 'En attente que l\'hote lance la partie...'}
            </p>
            <div className="actions">
              {isHost && (
                <button className="btn primary">Lancer la partie</button>
              )}
              <button className="btn ghost" onClick={() => navigate('/quiz')}>
                Quitter la salle
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default MultiPlayerCodeRoom
