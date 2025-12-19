import { useNavigate } from 'react-router-dom'
import '../App.css'

function SoloGamePage() {
  const navigate = useNavigate()

  return (
    <main className="page">
      <div className="shell">
        <p className="eyebrow">Quiz Sprint - Mode Solo</p>
        <div className="hero">
          <div className="copy">
            <h1>Partie Solo en cours</h1>
            <p className="lede">Le jeu solo est lance ! A voir comment on va gerer la suite.</p>
            <div className="actions">
              <button className="btn primary">Question suivante</button>
              <button className="btn ghost" onClick={() => navigate('/quiz')}>
                Quitter la partie
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default SoloGamePage
