import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import '../App.css'

function QuizPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <main className="page">
      <div className="shell">
        <p className="eyebrow">{t('app_name')}</p>
        <div className="hero">
          <div className="copy">
            <h1>{t("quiz_title")}</h1>
            <p className="lede">{t("quiz_description")}</p>
            <div className="actions">
              <button className="btn ghost" onClick={() => navigate('/')}>{t("back_home")}</button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            maxWidth: '800px',
            margin: '0 auto',
          }}>
            <button className="btn primary" onClick={() => navigate('/quiz/solo-setup')}>{t("solo_mode")}</button>
            <button className="btn primary" onClick={() => navigate('/quiz/multi-setup')}>{t("create_room")}</button>
            <button className="btn primary" onClick={() => navigate('/quiz/join')}>{t("join_room")}</button>
          </div>
        </div>
      </div>
    </main>
  )
}

export default QuizPage
