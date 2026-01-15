import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import '../App.css'

// const SpaceZone = [
//   { label: '\u00A0', value: ' ' }, //genere juste des espaces, plus jolie
// ]


function QuizPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <main className="page">
      <div className="shell">
        <p className="eyebrow">Quiz Sprint</p>
        <div className="hero">
          <div className="copy">
            <h1>{t("quiz_title")}</h1>
            <p className="lede">{t("quiz_description")}</p>
            {/* <div className="SpaceZone"> */}
              {/* {SpaceZone.map((item) => (
                <div key={item.label} className="highlight">
                  <span className="label">{item.label}</span>
                  <span className="value">{item.value}</span>
                </div>
              ))} */}
            {/* </div> */}
            <div className="actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="btn primary" onClick={() => navigate('/quiz/solo-setup')}>{t("solo_mode")}</button>
              <button className="btn primary" onClick={() => navigate('/quiz/multi')}>{t("create_room")}</button>
              <button className="btn primary" onClick={() => navigate('/quiz/join')}>{t("join_room")}</button>
              {/*a voir comment on va gerer les tournois, je nous cree le bouton mais pas plus*/}
              <button className="btn primary" onClick={() => navigate('')}>{t("tournament")}</button>
              <button className="btn ghost" onClick={() => navigate('/')}>{t("back_home")}</button>
            </div>
            </div>
          </div>
        </div>
    </main>
  )
}

export default QuizPage
