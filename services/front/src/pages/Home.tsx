import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'
import { privacyContent, termsContent } from '../content/policies'
import { useTranslation } from 'react-i18next';
import LanguageSelector from './../content/LanguageSelector.tsx'
import ThemeSelector from './../content/ThemeSelector.tsx'
import FontSelector from './../content/FontSelector.tsx'

const topics = (t: any) => [
  { title: t('histoire'), detail: t('histoire_desc') },
  { title: t('cinema_series'), detail: t('cinema_series_desc') },
  { title: t('music'), detail: t('music_desc') },
]

const SpaceZone = [
  { label: '\u00A0', value: ' ' }, //genere juste des espaces
  { label: '\u00A0', value: ' ' },
  { label: '\u00A0', value: ' ' }
]

function HomePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [policy, setPolicy] = useState<'privacy' | 'terms' | null>(null)

  return (
    <main className="page">
      <LanguageSelector />
      <ThemeSelector />
      <FontSelector />
      <div className="login-bar">
        <button className="btn login" onClick={() => setShowLogin(true)}>
          {t("connect")}
        </button>
        <button className="btn primary" onClick={() => setShowSignup(true)}>
          {t("signup")}
        </button>
      </div>
      <div className="shell">
        <p className="eyebrow">Quiz Sprint</p>
        <div className="hero">
          <div className="copy">
            <h1>{t("ready")}</h1>
            <p className="lede">
              {t("tagline")}
            </p>
            <div className="actions">
              <button className="btn primary" onClick={() => navigate('/quiz')}>
                {t("start_quiz")}
              </button>
              <button className="btn ghost">{t("daily_challenge")}</button>
            </div>
            <div className="SpaceZone">
              {SpaceZone.map((item) => (
                <div key={item.label} className="highlight">
                  <span className="label">{item.label}</span>
                  <span className="value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="panel-title">  </div>
            <div className="grid">
              {topics(t).map((topic) => (
                <article key={topic.title} className="card">
                  <div className="card-head">{topic.title}</div>
                  <p className="card-body">{topic.detail}</p>
                  <span className="card-cta">{t("start_quiz")}</span>
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
            <p className="footer__lede">{t("footer_tagline")}</p>
          </div>
          <div className="footer__links">
            <a href="#">{t("about")}</a>
            <a href="#">{t("faq")}</a>
            <a href="#">{t("contact")}</a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setPolicy('privacy')
              }}
            >
              {t("privacy_policy")}
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setPolicy('terms')
              }}
            >
              {t("terms")}
            </a>
          </div>
        </div>
      </footer>

      {/* Modal d'affichage des politiques (Privacy / Terms) */}
      {policy && (
        <div className="login-overlay" role="dialog" aria-modal="true">
          <div className="login-card">
            <div className="login-card__head">
              <div>
                <p className="eyebrow small">
                  {policy === 'privacy' ? t("privacy_policy") : t("terms")}
                </p>
                <h2>{policy === 'privacy' ? t("privacy_policy") : t("terms")}</h2>
              </div>
              <button className="close" aria-label="Fermer" onClick={() => setPolicy(null)}>
                ×
              </button>
            </div>
            <div className="policy-content">{policy === 'privacy' ? privacyContent : termsContent}</div>
          </div>
        </div>
      )}

      {showLogin && (
        <div className="login-overlay" role="dialog" aria-modal="true">
          <div className="login-card">
            <div className="login-card__head">
              <div>
                <p className="eyebrow small">{t("login_title")}</p>
                <h2>{t("login_subtitle")}</h2>
              </div>
              <button className="close" aria-label={t("close")} onClick={() => setShowLogin(false)}>
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
                <span>{t("email")}</span>
                <input type="email" placeholder={t("email_placeholder")} required />
              </label>
              <label className="field">
                <span>{t("password")}</span>
                <input type="password" placeholder={t("password_placeholder")} required />
              </label>
              <button type="submit" className="btn primary full">
                {t("login_button")}
              </button>
            </form>
          </div>
        </div>
      )}

      {showSignup && (
        <div className="login-overlay" role="dialog" aria-modal="true">
          <div className="login-card">
            <div className="login-card__head">
              <div>
                <p className="eyebrow small">{t("signup_title")}</p>
                <h2>{t("signup_subtitle")}</h2>
              </div>
              <button className="close" aria-label={t("close")} onClick={() => setShowSignup(false)}>
                ×
              </button>
            </div>
            <form
              className="login-form"
              onSubmit={(e) => {
                e.preventDefault()
                setShowSignup(false)
              }}
            >
              <label className="field">
                <span>{t("email")}</span>
                <input type="email" placeholder={t("email_placeholder")} required />
              </label>
              <label className="field">
                <span>{t("username")}</span>
                <input type="text" placeholder={t("username_placeholder")} required />
              </label>
              <label className="field">
                <span>{t("password")}</span>
                <input type="password" placeholder={t("password_placeholder")} required />
              </label>
              <label className="field">
                <span>{t("confirm_password")}</span>
                <input type="password" placeholder={t("password_placeholder")} required />
              </label>
              <button type="submit" className="btn primary full">
                {t("signup_button")}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default HomePage
