import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import '../App.css'

const themes = (t: any) => [
  { id: 'All', slug: 'all', title: t('all'), detail: t('all_desc'), icon: '' },
  { id: 'Histoire', slug: 'histoire', title: t('histoire'), detail: t('histoire_desc'), icon: '' },
  { id: 'Musiques', slug: 'musiques', title: t('music'), detail: t('music_desc'), icon: '' },
  { id: 'Sports', slug: 'sports', title: t('sports'), detail: t('sports_desc'), icon: '' },
  { id: 'Cinéma', slug: 'cinema', title: t('cinema'), detail: t('cinema_desc'), icon: '' },
  { id: 'JeuxVidéo', slug:'jeuxvideo' ,title:t('video_games'),detail:t('video_games_desc'),icon:''},
  { id: 'Echec', slug: 'echec', title: t('chess'), detail: t('chess_desc'), icon: '' },
  { id: 'Informatique', slug: 'informatique', title: t('Informatique'), detail: t('Informatique_desc'), icon: '' }
]

const powerUps = (t: any) => [
  { id: 'skip', slug: 'skip', title: t('pu_skip'), detail: t('pu_skip_desc'), icon: '' },
  { id: 'hint', slug: 'hint', title: t('pu_hint'), detail: t('pu_hint_desc'), icon: '' },
  { id: 'fifty', slug: 'fifty', title: t('pu_5050'), detail: t('pu_5050_desc'), icon: '' },
];

const MAX_POWERUPS = 3;
const MIN_Q = 2;
const MAX_Q = 10;
const MIN_P = 2;
const MAX_P = 8;
const STORAGE_KEY = 'soloGameState:v1'


function SoloGameSetup() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set())
  const [showThemesCard, setShowThemesCard] = useState(false)
  const [showPowerUpsCard, setShowPowerUpsCard] = useState(false);
  const [selectedPowerUps, setSelectedPowerUps] = useState<Set<string>>(new Set());
  const [showQuestionCountCard, setShowQuestionCountCard] = useState(false);
  const [showPlayerCountCard, setShowPlayerCountCard] = useState(false);
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [questionCount, setQuestionCount] = useState<number>(2);
  const themeList = themes(t)
  const themeIds = themeList.filter((theme) => theme.id !== 'All').map((theme) => theme.id)



  const handleThemeToggle = (themeId: string) => {
    if (themeId === 'All') {
      if (selectedThemes.has('All')) {
        setSelectedThemes(new Set())
      } else {
        setSelectedThemes(new Set(['All', ...themeIds]))
      }
      return
    }

    const newSelected = new Set(selectedThemes)
    if (newSelected.has(themeId)) {
      newSelected.delete(themeId)
    } else {
      newSelected.add(themeId)
    }

    const allSelected = themeIds.every((id) => newSelected.has(id))
    if (allSelected) {
      newSelected.add('All')
    } else {
      newSelected.delete('All')
    }

    setSelectedThemes(newSelected)
  }

  const handlePowerUpToggle = (powerUpId: string) => {
    
    setSelectedPowerUps(prev => {
      const next = new Set(prev);

      if (next.has(powerUpId)) {
        next.delete(powerUpId);
        return next;
      }

      if (next.size >= MAX_POWERUPS) {
        return next;
      }

      next.add(powerUpId);
      return next;
    });
  };

  async function getUserId() {
    localStorage.removeItem("userId");
    const response = await fetch(`https://localhost/api/user/me_id`, {
      method: 'GET',
      credentials: 'include',
    })
    if (!response.ok) {
      console.error("Failed to fetch user ID")
      return
    }
    const currentUserId = await response.json();
    localStorage.setItem("userId", String(currentUserId.id));
  }

  const handleStartGame = async () => {
    console.log("Theme List : ", themeList);
    console.log("powerUps List : ", powerUps(t));
    console.log("Selected Power-ups:", Array.from(selectedPowerUps));
    if (selectedThemes.size > 0) {
      let topic = Array.from(selectedThemes).filter((theme) => theme !== 'All');
      if (topic.includes('all')) {
        topic = [];
      }
      console.log("Selected themes for API:", topic);
      console.log("Player Count:", playerCount);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("sessionId");
      localStorage.removeItem("questionCount");
      localStorage.removeItem("maxPlayers");
      localStorage.removeItem("sessionCode");
      let count = questionCount;
      if (count < MIN_Q)
        count = MIN_Q;
      else if (count > MAX_Q)
        count = MAX_Q;

      let playerNum = playerCount;
      if (playerNum < MIN_P)
        playerNum = MIN_P;
      else if (playerNum > MAX_P)
        playerNum = MAX_P;

      const session = await fetch("https://localhost/api/quiz/game-sessions", {
        method: 'POST',
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "random",
          topic: topic,
          question_count: count,
          max_players: playerNum,
          power_ups: Array.from(selectedPowerUps),
        }),
      });
      if (!session.ok) {
        throw new Error("Session couldn't start");
      }
      const data = await session.json();
      localStorage.setItem("sessionId", String(data.sessionId));
      localStorage.setItem("sessionCode", String(data.sessionCode));
      localStorage.setItem("maxPlayers", String(playerNum));
      localStorage.setItem("questionCount", String(count));
      getUserId();
      navigate('/quiz/multi', { state: { themes: Array.from(selectedThemes), questionCount: count, playerCount: playerNum, powerUps: Array.from(selectedPowerUps), sessionId: data.sessionId } });
    }
  }

  return (
    <main className="page" dir={i18n.dir()}>
      <div className="shell">
        <p className="eyebrow">{t('app_name')} - {t("multiplayer_mode")}</p>
        <div className="hero">
          <div className="copy">
            <h1>{t("select_theme")}</h1>
            <p className="lede">{t("choose_theme_description")}</p>
            <div className="actions">
              <button
                className="btn ghost"
                onClick={() => navigate('/quiz')}
              >
                {t("back")}
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            className="btn primary"
            onClick={() => setShowThemesCard(!showThemesCard)}
          >
            {selectedThemes.size > 0 
              ? `${selectedThemes.size} ${t('themes_selected')}` 
              : t('choose_themes')}
          </button>
        </div>

        {showThemesCard && (
          <div style={{
            marginTop: '2rem',
            padding: 'clamp(1rem, 3vw, 2rem)',
            backgroundColor: '#ffffffff',
            border: '2px solid #000000',
            borderRadius: '8px',
            boxShadow: '4px 4px 0px #000000',
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)' }}>{t("available_themes")}</h3>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
            }}>
              {themes(t).map((theme) => (
                <label
                  key={theme.slug}
                  style={{
                    display: 'flex',
                    flexDirection: isRtl ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    padding: 'clamp(0.75rem, 2vw, 1rem)',
                    backgroundColor: '#f9f9f9',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    position: 'relative',
                    textAlign: isRtl ? 'right' : 'left'
                  }}
                >
                  <div style={{ 
                    position: 'relative', 
                    width: '64px', 
                    height: '64px', 
                    marginInlineEnd: '1rem',
                    flexShrink: 0 
                  }}>
                    <img
                      src={selectedThemes.has(theme.id) ? `/theme-icons/${theme.id}.gif` : `/theme-icons/${theme.id}.png`}
                      alt={theme.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        imageRendering: 'pixelated',
                        position: 'absolute',
                        zIndex: 1,
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.style.display = 'none';
                      }}
                    />
                    <input
                      type="checkbox"
                      checked={selectedThemes.has(theme.slug)}
                      onChange={() => handleThemeToggle(theme.slug)}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 2,
                        cursor: 'pointer',
                        width: '24px',
                        height: '24px',
                        opacity: 0.7
                      }}
                    />
                  </div>
                  <div style={{ width: '100%' }}>
                    <div style={{ fontWeight: 'bold', fontSize: 'clamp(14px, 2vw, 16px)' }}>{theme.title}</div>
                    <div style={{ fontSize: 'clamp(12px, 1.5vw, 14px)', color: '#666' }}>{theme.detail}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button
          className="btn primary"
          onClick={() => setShowQuestionCountCard(v => !v)}
          disabled={selectedThemes.size === 0}
          style={{
          opacity: selectedThemes.size > 0 ? 1 : 0.5,
          cursor: selectedThemes.size > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          {t('question_count')} : {questionCount}
        </button>
      </div>
      {showQuestionCountCard && (
    <div style={{
        marginTop: '2rem',
        padding: 'clamp(1rem, 3vw, 2rem)',
        backgroundColor: '#ffffffff',
        border: '2px solid #000000',
        borderRadius: '8px',
        boxShadow: '4px 4px 0px #000000',
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)' }}>
            {t('choose_question_count')}
          </h3>
          <div style={{ color: '#666' }}>
            {t('selected')} : <b>{questionCount}</b>
          </div>
        </div>

        <input
          type="range"
          min={MIN_Q}
          max={MAX_Q}
          step={1}
          value={questionCount}
          onChange={(e) => setQuestionCount(Number(e.target.value))}
          style={{ width: '100%' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', color: '#666' }}>
          <span>{MIN_Q}</span>
          <span>{MAX_Q}</span>
        </div>
      </div>
    )}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button
          className="btn primary"
          onClick={() => setShowPlayerCountCard(v => !v)}
          disabled={selectedThemes.size === 0}
          style={{
          opacity: selectedThemes.size > 0 ? 1 : 0.5,
          cursor: selectedThemes.size > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          {t('players_count')} : {playerCount}
        </button>
      </div>
      {showPlayerCountCard && (
        <div style={{
          marginTop: '2rem',
          padding: 'clamp(1rem, 3vw, 2rem)',
          backgroundColor: '#ffffffff',
          border: '2px solid #000000',
          borderRadius: '8px',
          boxShadow: '4px 4px 0px #000000',
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)' }}>
              {t('chooseplayercount')}
            </h3>
            <div style={{ color: '#666' }}>
              {t('selected')} : <b>{playerCount}</b>
            </div>
          </div>

          <input
            type="range"
            min={MIN_P}
            max={MAX_P}
            step={1}
            value={playerCount}
            onChange={(e) => setPlayerCount(Number(e.target.value))}
            style={{ width: '100%' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', color: '#666' }}>
            <span>{MIN_P}</span>
            <span>{MAX_P}</span>
          </div>
        </div>
    )}

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            className="btn primary"
            onClick={() => setShowPowerUpsCard(v => !v)}
            disabled={selectedThemes.size === 0}
            style={{
              opacity: selectedThemes.size > 0 ? 1 : 0.5,
              cursor: selectedThemes.size > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            {selectedPowerUps.size > 0
              ? `${selectedPowerUps.size}/${MAX_POWERUPS} ${t('power_ups_selected')}`
              : t('power_ups')}
          </button>
      </div>

      {showPowerUpsCard && (
        <div style={{
          marginTop: '2rem',
          padding: 'clamp(1rem, 3vw, 2rem)',
          backgroundColor: '#ffffffff',
          border: '2px solid #000000',
          borderRadius: '8px',
          boxShadow: '4px 4px 0px #000000',
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)' }}>
              {t("available_powerups")}
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
          }}>
            {powerUps(t).map((pu) => {
              const isChecked = selectedPowerUps.has(pu.id)
              const limitReached = selectedPowerUps.size >= MAX_POWERUPS

              return (
                <label
                  key={pu.id}
                  style={{
                    display: 'flex',
                    flexDirection: isRtl ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    padding: 'clamp(0.75rem, 2vw, 1rem)',
                    backgroundColor: '#f9f9f9',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    position: 'relative',
                    textAlign: isRtl ? 'right' : 'left'
                  }}
                >
                  <div style={{
                    position: 'relative',
                    width: '64px',
                    height: '64px',
                    marginInlineEnd: '1rem',
                    flexShrink: 0
                  }}>
                    <img
                      src={isChecked ? `/powerup-icons/${pu.id}.gif` : `/powerup-icons/${pu.id}.png`}
                      alt={pu.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        imageRendering: 'pixelated',
                        position: 'absolute',
                        zIndex: 1,
                        objectFit: 'contain'
                      }}
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />

                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handlePowerUpToggle(pu.id)}
                      disabled={!isChecked && limitReached}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 2,
                        cursor: 'pointer',
                        width: '24px',
                        height: '24px',
                        opacity: 0.7
                      }}
                    />
                  </div>

                  <div style={{ width: '100%' }}>
                    <div style={{ fontWeight: 'bold', fontSize: 'clamp(14px, 2vw, 16px)' }}>
                      {pu.title}
                    </div>
                    <div style={{ fontSize: 'clamp(12px, 1.5vw, 14px)', color: '#666' }}>
                      {pu.detail}
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      )}


        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            className="btn primary"
            onClick={handleStartGame}
            disabled={selectedThemes.size === 0}
            style={{
              opacity: selectedThemes.size > 0 ? 1 : 0.5,
              cursor: selectedThemes.size > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            {t("start_game")}
          </button>
        </div>
      </div>
    </main>
  )
}

export default SoloGameSetup