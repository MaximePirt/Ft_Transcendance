import { useNavigate } from 'react-router-dom'
import '../App.css'

const SpaceZone = [
  { label: '\u00A0', value: ' ' }, //genere juste des espaces, plus jolie
  { label: '\u00A0', value: ' ' },
]


function QuizPage() {
  const navigate = useNavigate()

  return (
    <main className="page">
      <div className="shell">
        <p className="eyebrow">Quiz Sprint</p>
        <div className="hero">
          <div className="copy">
            <h1>Lance ton premier quiz</h1>
            <p className="lede">Choisis un mode de jeu et commence sans quitter la page.</p>
            <div className="SpaceZone">
              {SpaceZone.map((item) => (
                <div key={item.label} className="highlight">
                  <span className="label">{item.label}</span>
                  <span className="value">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="actions">
              <button className="btn primary" onClick={() => navigate('/quiz/solo')}>🎮 Solo</button>
              <button className="btn primary" onClick={() => navigate('/quiz/multi')}>🏠 Créer une salle</button>
              <button className="btn primary" onClick={() => navigate('/quiz/join')}>🚪 Rejoindre une salle</button>
              {/*a voir comment on va gerer les tournois, je nous cree le bouton mais pas plus*/}
              <button className="btn primary" onClick={() => navigate('')}>🏆Tournoi 🏆</button>
              <button className="btn ghost" onClick={() => navigate('/')}> Retour à l'accueil</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default QuizPage
