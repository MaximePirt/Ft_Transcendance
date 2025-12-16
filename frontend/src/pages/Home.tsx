import { useState } from 'react'
import '../App.css'

const topics = [
  { title: 'Culture generale', detail: 'Histoire, geo, sciences et actu pour tester ta curiosite.' },
  { title: 'Cine / Series', detail: 'Personnages cultes, repliques, bandes originales et anecdotes.' },
  { title: 'Musique', detail: 'Blind tests, paroles et fun facts des artistes que tu aimes.' },
]

const highlights = [
  { label: 'Questions fraiches', value: 'Mises a jour chaque semaine' },
  { label: 'Solo ou groupe', value: 'Pret pour les soirees et aperos' },
  { label: 'Rapide', value: '< 5 min pour un quiz' },
]

function HomePage() {
  const [showLogin, setShowLogin] = useState(false)

  return (
    <main className="page">
      <div className="login-bar">
        <button className="btn login" onClick={() => setShowLogin(true)}>
          Se connecter
        </button>
      </div>
      <div className="shell">
        <p className="eyebrow">Quiz Sprint</p>
        <div className="hero">
          <div className="copy">
            <h1>Pret a buzzer ?</h1>
            <p className="lede">
              Lance un quiz express, defie tes potes ou revise en solo. Une page simple, juste ce qu il faut pour
              commencer.
            </p>
            <div className="actions">
              <button className="btn primary">Commencer un quiz</button>
              <button className="btn ghost">Parcourir les categories</button>
            </div>
            <div className="highlights">
              {highlights.map((item) => (
                <div key={item.label} className="highlight">
                  <span className="label">{item.label}</span>
                  <span className="value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="panel-title">Choisis ta categorie</div>
            <div className="grid">
              {topics.map((topic) => (
                <article key={topic.title} className="card">
                  <div className="card-head">{topic.title}</div>
                  <p className="card-body">{topic.detail}</p>
                  <span className="card-cta">Ouvrir</span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="footer__inner">
          <div>
            <p className="eyebrow small">Quiz Sprint</p>
            <p className="footer__lede">Un quiz express, quelques clics, et c est parti.</p>
          </div>
          <div className="footer__links">
            <a href="#">A propos</a>
            <a href="#">FAQ</a>
            <a href="#">Contact</a>
          </div>
        </div>
      </footer>

      {showLogin && (
        <div className="login-overlay" role="dialog" aria-modal="true">
          <div className="login-card">
            <div className="login-card__head">
              <div>
                <p className="eyebrow small">Connexion</p>
                <h2>Reviens buzzer</h2>
              </div>
              <button className="close" aria-label="Fermer" onClick={() => setShowLogin(false)}>
                ×
              </button>
            </div>
            <form
              className="login-form"
              onSubmit={(e) => {
                e.preventDefault()
                setShowLogin(false)
              }}
            >
              <label className="field">
                <span>Email</span>
                <input type="email" placeholder="toi@email.fr" required />
              </label>
              <label className="field">
                <span>Mot de passe</span>
                <input type="password" placeholder="••••••••" required />
              </label>
              <button type="submit" className="btn primary full">
                Se connecter
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default HomePage
