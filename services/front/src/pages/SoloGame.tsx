import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import '../App.css'

const exitbutton = [
  { id: 'musiques', symbol: '🚪', url: '/custom-assets/music-exit-icon.png' },
  { id: 'echec', symbol: '🚪', url: '/custom-assets/chess-exit-icon.png' },
  { id: 'histoire', symbol: '🚪', url: '/custom-assets/history-exit-icon.png' },
  { id: 'sports', symbol: '🚪', url: '/custom-assets/sports-exit-icon.png' },
  { id: 'cinéma', symbol: '🚪', url: '/custom-assets/cinema-exit-icon.png' },
  { id: 'jeuxvidéo', symbol: '🚪', url: '/custom-assets/games-exit-icon.png' },
  { id: 'informatique', symbol: '🚪', url: '/custom-assets/informatique-exit-icon.png' },
]

interface Option {
  position: number
  label: string
}

interface Question {
  id: number
  category_slug: string
  question_order: number
  question_text: string
  type: 'mcq' | 'text'
  options?: Option[]
}

interface removedOption {
  label: string
  position: number
}

interface  AnswerMCQ {
  answer: Array<string>
  type: string
}

interface  AnswerText {
  answer: Array<string>
  type: string
}

interface AnswerResult {
		is_correct: number
		current_score: number
		correct_answers: AnswerMCQ | AnswerText
		total_correct: number
		total_answered: number
}

interface GameState {
  sessionId: number
  questionCount: number
  themes: string[]
  powerups: string[] | null
}

const STORAGE_KEY = 'soloGameState:v1'
const MAX_SLOTS = 2

function SoloGamePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const routeState = location.state as GameState | null;

  const [question, setQuestion] = useState<Question>()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [rightAnswer, setRightAnswer] = useState<string | number>()
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [removedOptions, setRemovedOptions] = useState<removedOption[]>([])
  const [powerups, setPowerups] = useState<(string | null)[]>(Array(MAX_SLOTS).fill(null))

  useEffect(() => {
    const abortController = new AbortController()
    
    // Si un état est sauvegardé, le restaurer immédiatement pour éviter un reset au refresh
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.question) {
          setQuestion(parsed.question)
          setCurrentQuestionIndex(parsed.currentQuestionIndex ?? 0)
          setUserAnswer(parsed.userAnswer ?? '')
          setSelectedOption(parsed.selectedOption ?? null)
          setScore(parsed.score ?? 0)
          setShowAnswer(parsed.showAnswer ?? false)
          setIsCorrect(parsed.isCorrect ?? false)
          setRightAnswer(parsed.rightAnswer ?? undefined)
          setHint(parsed.hint ?? null)
          setRemovedOptions(parsed.removedOptions ?? [])
          setLoading(false)
          setPowerups(parsed.powerups ?? Array(MAX_SLOTS).fill(null))
          return
        }
      } catch (err) {
        console.warn('[SoloGame] failed to restore saved state', err)
      }
    }

    // FETCH DE LA QUESTION
    const fetchQuestion = async () => {
      try {
        const sessionIdStr = await localStorage.getItem("sessionId");
        const sessionId = sessionIdStr ? Number(sessionIdStr) : null;
        if (!sessionId)
          throw new Error('Invalid session ID')
        const response = await fetch(`https://localhost/api/quiz/game-sessions/${sessionId}/current-question`, {
          signal: abortController.signal,
        })
        if (!response.ok) {
          throw new Error('Failed to fetch question')
        }


        const data = await response.json()
        setLoading(false)
        setQuestion(data.question)
      } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') return
          setError(err instanceof Error ? err.message : t('error_occurred'))
          setLoading(false)
        }
    }

    fetchQuestion()
    
    return () => abortController.abort()
    }, [])

    // POWER UPS
    useEffect(() => {
    const sessionIdStr = localStorage.getItem("sessionId")
    const sessionId = sessionIdStr ? Number(sessionIdStr) : null
    if (!sessionId)
      return
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(
      `${proto}//${window.location.host}/ws/quiz/game-sessions/${sessionId}`
    );
    socket.onopen = () => {
      console.log("WebSocket connected")
    }

    socket.onmessage = async (event) => {
      const msg = JSON.parse(event.data)

      if (msg.type === "powerups_granted") {
        const userIdStr = localStorage.getItem("userId")
        const userId = userIdStr ? Number(userIdStr) : null
        const newTypes: string[] = msg.payload.powerups
          .filter((p: any) => p.user_id === userId)
          .map((p: any) => p.powerup_type)

        setPowerups(prev => {
          const updated = [...prev]

          newTypes.forEach((type: string) => {
            const emptyIndex = updated.findIndex(p => p === null)
            if (emptyIndex !== -1) {
              updated[emptyIndex] = type
            }
          })

          return updated
        })
      }

      if (msg.type === "powerup_used") {
        if (!msg.payload.ok) return

        const usedType = msg.payload.powerup_type

        setPowerups(prev => {
          const updated = [...prev]
          const index = updated.findIndex(p => p === usedType)
          if (index !== -1) {
            updated[index] = null
          }
          return updated
        })

        if (usedType === "hint") {
          setHint(msg.payload.hint);
        }
        if (usedType === "fifty") {
          setRemovedOptions(msg.payload.removed_options);
        }
        if (usedType === "skip") {
          if (msg.payload.correct_answer.type === "text") {
            let answer: AnswerText = msg.payload.correct_answer
            setRightAnswer(answer.answer[0])
          }
          else {
            let answer: AnswerMCQ = msg.payload.correct_answer
            setRightAnswer(answer.answer[0])
          }
          setIsCorrect(true)
          setShowAnswer(true)
        }
      }
      else if (msg.type === "next_question") {
        let question_count_str;
        try{
          question_count_str = await localStorage.getItem("questionCount");
        }
        catch(err) {
          console.log('Error accessing localStorage for question count:', err)
          question_count_str = null
        }
        let question_count = Number(question_count_str) || 0;
        const isLastQuestion = currentQuestionIndex === question_count - 1

        if (isLastQuestion) {
          console.log("Quiz terminé, score final:", score)
          localStorage.removeItem(STORAGE_KEY)
          localStorage.removeItem("questionCount")
          navigate("/quiz/end", { state: { score, total: question_count, mode: "solo" } })
          return
        }

        setCurrentQuestionIndex(prev => {
          const next = prev + 1
          return next
        })
        setUserAnswer('')
        setSelectedOption(null)
        setShowAnswer(false)
        setIsCorrect(false)
        setHint(null)
        setRemovedOptions([])
        try {
            const sessionIdStr = await localStorage.getItem("sessionId");
            const sessionId = sessionIdStr ? Number(sessionIdStr) : null;
            if (!sessionId)
              throw new Error('Invalid session ID')
            const response = await fetch(`https://localhost/api/quiz/game-sessions/${sessionId}/current-question`, {
            })
            if (!response.ok) {
              throw new Error('Failed to fetch question')
            }

            const { question } = await response.json()
            const data: Question = question
            setLoading(false)
            setQuestion(data)
          }
          catch (err) {
              if (err instanceof Error && err.name === 'AbortError') return
              setError(err instanceof Error ? err.message : t('error_occurred'))
              setLoading(false)
          }
        }
        else if (msg.type === "session_completed" || msg.type === "session_ended") {

          console.log("Quiz terminé, score final:", score)
          localStorage.removeItem(STORAGE_KEY)
          localStorage.removeItem("questionCount")
          navigate("/quiz/end", { state: { score, total: msg.payload.question_count, mode: "solo" } })
        }
    }

    socket.onerror = (err) => {
      console.error("WebSocket error", err)
    }

    setWs(socket)
    return () => socket.close()
  }, [])

  useEffect(() => {
    if (loading || error || !question) return

    const payload = {
      question,
      currentQuestionIndex,
      userAnswer,
      selectedOption,
      powerups,
      showAnswer,
      isCorrect,
      rightAnswer,
      hint,
      score,
    }

    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch (err) {
      console.warn('[SoloGame] failed to persist state', err)
    }
  }, [question, currentQuestionIndex, userAnswer, selectedOption, powerups, showAnswer, isCorrect, rightAnswer, hint, score])

  useEffect(() => {
  if (!routeState) return;

  const initialGameState = {
    sessionId: routeState.sessionId,
    questionCount: routeState.questionCount,
    themes: routeState.themes,
    powerups: routeState.powerups,
    questions: null,
    currentQuestionIndex: 0,
    userAnswers: "",
    selectedOptions: null,
    scores: 0,
    mode: "solo",
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialGameState));
}, [routeState]);



  // REPONSE CHECK
  const handleValidateAnswer = async () => {
    if (!question) return

    let playerAnswer: string | number = 0
    let id: number = question.id

    if (question.type == "mcq") {
      ;(question.options ?? []).map((optionObj: Option, index: number) => {
        let option = optionObj.label

        if (selectedOption === option)
          playerAnswer = index
      })
    }
    else
      playerAnswer = userAnswer

    try {
      const sessionIdStr = await localStorage.getItem("sessionId");
      const sessionId = sessionIdStr ? Number(sessionIdStr) : null;
      console.log("Session ID from localStorage:", sessionIdStr);
      if (!sessionId)
        throw new Error('Invalid session ID')
      const response = await fetch(`https://localhost/api/quiz/game-sessions/${sessionId}/answer`, {
        method: 'POST',
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: id,
          answer: playerAnswer,
        }),
      });
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to get the answer')
      }

      const json = await response.json()
      const data: AnswerResult = json.result

      if (data.correct_answers.type === "text") {
        let answer: AnswerText = data.correct_answers
        setRightAnswer(answer.answer[0])
      } else {
        let answer: AnswerMCQ = data.correct_answers
        setRightAnswer(answer.answer[0])
      }
      setIsCorrect(Boolean(data.is_correct))
      setShowAnswer(true)
      if (Boolean(data.is_correct)) {
        setScore(data.current_score)
      }
    } catch (err) {
      console.warn('[SoloGame] failed to get the answer', err)
    }
  }

  // PASSER A LA QUESTION SUIVANTE
  const handleNextQuestion = async () => {
    const abortController = new AbortController()

    const sessionIdStr = await localStorage.getItem("sessionId");
    const sessionId = sessionIdStr ? Number(sessionIdStr) : null;
    if (!sessionId)
      throw new Error('Invalid session ID')
    try {
      const response = await fetch(`https://localhost/api/quiz/game-sessions/${sessionId}/next-question`, {
        method: 'GET',
        credentials: 'include',
      })
      if (!response.ok) {
        console.log("FHJEUHFUEHFUEHUFHEUFHUEU");
        console.log("Failed to get next question:", response.status, response.statusText)
        // throw new Error('Failed to get the next question');
      }
      console.log("Here is response : ", response)

    }
    catch (err) {
      console.log("FHEIUHFEIUHUDHOWIIJOIMOMSOIWNOWNIDNWOD");
      console.log("API ERROR:", err)
      throw new Error('Failed to get the next question');
    }

    let question_count_str;
    try{
      question_count_str = await localStorage.getItem("questionCount");
    }
    catch(err)    {
      console.log('Error accessing localStorage for question count:', err)
      question_count_str = null
    }
    let question_count = Number(question_count_str) || 0;
    const isLastQuestion = currentQuestionIndex >= question_count - 1

    if (isLastQuestion) {
      console.log("Quiz terminé, score final:", score)
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem("questionCount")
      navigate("/quiz/end", { state: { score, total: question_count, mode: "solo" } })
      return
    }

    setCurrentQuestionIndex(currentQuestionIndex + 1)
    setUserAnswer('')
    setSelectedOption(null)
    setShowAnswer(false)
    setIsCorrect(false)
    setHint(null)
    setRemovedOptions([])
    try {
        const sessionIdStr = await localStorage.getItem("sessionId");
        const sessionId = sessionIdStr ? Number(sessionIdStr) : null;
        if (!sessionId)
          throw new Error('Invalid session ID')
        const response = await fetch(`https://localhost/api/quiz/game-sessions/${sessionId}/current-question`, {
          signal: abortController.signal,
        })
        if (!response.ok) {
          throw new Error('Failed to fetch question')
        }

        const { question } = await response.json()
        const data: Question = question
        setLoading(false)
        setQuestion(data)
      } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') return
          setError(err instanceof Error ? err.message : t('error_occurred'))
          setLoading(false)
        }
    }

  const handleOptionClick = (option: string) => {
    if (!showAnswer) {
      setSelectedOption(option)
    }
  }

  const leaveGame = async () => {
    const abortController = new AbortController()

    try {
      const sessionIdStr = await localStorage.getItem("sessionId");
      const sessionId = sessionIdStr ? Number(sessionIdStr) : null;
      if (!sessionId)
        throw new Error('Invalid session ID')
      const response = await fetch(`https://localhost/api/quiz/game-sessions/${sessionId}/players/me`, {
        method: 'DELETE',
        credentials: 'include',
        signal: abortController.signal,
      })
      if (!response.ok) {
        throw new Error('Failed to fetch question')
      }
      setLoading(false)
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem("questionCount")
      navigate('/quiz')
    } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : t('error_occurred'))
        setLoading(false)
      }
    return () => abortController.abort()
  }


  if (loading) {
    return (
      <main className="page">
        <div className="shell">
          <p className="eyebrow">Quiz Sprint - Mode Solo</p>
          <div className="hero">
            <div className="copy">
              <h1>Chargement...</h1>
              <p className="lede">Les questions se chargent...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="page">
        <div className="shell">
          <p className="eyebrow">Quiz Sprint - Mode Solo</p>
          <div className="hero">
            <div className="copy">
              <h1>Erreur</h1>
              <p className="lede">{error}</p>
              <div className="actions">
                <button className="btn ghost" onClick={() => navigate('/quiz')}>
                  Retour au Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!question) {
    return (
      <main className="page">
        <div className="shell">
          <p className="eyebrow">Quiz Sprint - Mode Solo</p>
          <div className="hero">
            <div className="copy">
              <h1>Aucune question disponible</h1>
              <p className="lede">Il n'y a pas de questions pour le moment.</p>
              <div className="actions">
                <button className="btn ghost" onClick={() => navigate('/quiz')}>
                  Retour au Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }


  let question_count_str;
  try{
    question_count_str = localStorage.getItem("questionCount");
  }
  catch(err)
  {
    console.log('Error accessing localStorage for question count:', err)
    question_count_str = null
  }
  if (!question_count_str) {
    console.log('No question count found in localStorage')
  }
  let question_count = Number(question_count_str) || 0;

  return (
    <main className="page">
      <div className="shell">
        {/* Header du Quiz */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px' }}>
          <p className="eyebrow">Quiz Sprint - Mode Solo</p>
          <div className="ExitButtonContainer">
              {(() => {
                const exitBtn = exitbutton.find(btn => btn.id === "informatique")
                return exitBtn && (
                  <button
                    onClick={() => {
                      if (window.confirm("Êtes-vous sûr de vouloir quitter la partie ? Votre progression ne sera pas sauvegardée.")) {
                        leaveGame()
                      }
                    }}
                    title="Quitter la partie"
                  >
                    {exitBtn.url ? (
                      <img src={exitBtn.url} alt={exitBtn.symbol} />
                    ) : (
                      exitBtn.symbol
                    )} 
                  </button>
              )
            })()}
          </div>
        </div>

        {/* Power ups */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          {powerups.map((p, index) => {

            const isDisabled = !p ||
            (p === "fifty" && question.type === "text") ||
            (p === "hint" && question.type === "mcq")

            return (
              <button
                key={index}
                className="btn ghost"
                disabled={isDisabled}
                style={{
                  opacity: isDisabled ? 0.4 : 1,
                  cursor: isDisabled ? "not-allowed" : "pointer"
                }}
                onClick={() => {
                  ws?.send(JSON.stringify({
                    type: "powerup_use",
                    payload: { powerupId: p }
                  }))
                }}
              >
                {p ?? "Powerup Slot"}
              </button>
            )
          })}
        </div>

        {/* Zone de Titre */}
        <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
          <h1>Partie Solo en cours</h1>
          <p className="lede" style={{ border: 'none', padding: 0, textAlign: 'center' }}>
            Question <strong>{currentQuestionIndex + 1}</strong> sur <strong>{question_count}</strong> • Score : <strong>{score}</strong>
          </p>
        </div>

        {/* LA CARTE DE JEU (Pleine largeur) */}
        <div className="quiz-card-full">
          <h2 style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '1.4rem' }}>
            {question.question_text}
          </h2>

          <div className="game-area">
            {question.type === 'mcq' && question.options ? (
              <div className="game-options-grid">
                {question.options.map((optionObj: Option, index: number) => {
                  let option = optionObj.label
                  if (removedOptions.length > 0 && removedOptions.find(o => o.label === option)) return null

                  const isCorrectAnswer = index === rightAnswer
                  const isSelected = selectedOption === option
                  let borderColor = '2px solid #000'
                  let backgroundColor = '#fff'
                  
                  if (showAnswer) {
                    if (isCorrectAnswer) {
                      borderColor = '4px solid #4CAF50'
                      backgroundColor = '#E8F5E9'
                    } else if (isSelected && !isCorrect) {
                      borderColor = '4px solid #f44336'
                      backgroundColor = '#FFEBEE'
                    }
                  } else if (isSelected) {
                    borderColor = '4px solid #4CAF50'
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleOptionClick(option)}
                      className={`btn ${selectedOption === option ? 'primary' : 'ghost'}`}
                      style={{ 
                        textTransform: 'none', 
                        fontSize: '1.1rem', 
                        padding: '18px 16px', 
                        minHeight: '60px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        border: borderColor,
                        background: backgroundColor,
                        cursor: showAnswer ? 'default' : 'pointer',
                        opacity: showAnswer && !isCorrect && !isSelected ? 0.6 : 1
                      }}
                      disabled={showAnswer}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="field">
                <input
                  type="text"
                  className="game-input-field"
                  placeholder="Tapez votre réponse ici..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !showAnswer && handleValidateAnswer()}
                  disabled={showAnswer}
                  style={{
                    border: showAnswer 
                      ? (isCorrect ? '3px solid #4CAF50' : '3px solid #f44336')
                      : '2px solid #000',
                    background: showAnswer
                      ? (isCorrect ? '#E8F5E9' : '#FFEBEE')
                      : '#fff'
                  }}
                />
                {!showAnswer && hint && (
                  <p style={{ marginTop: '12px', fontSize: '15px', color: '#4CAF50', fontWeight: 'bold' }}>
                    Indice : {hint}
                  </p>
                )}
                {showAnswer && !isCorrect && (
                  <p style={{ marginTop: '12px', fontSize: '15px', color: '#4CAF50', fontWeight: 'bold' }}>
                    Bonne réponse : {rightAnswer}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Bouton d'action centré ou plein pied */}
          <div className="actions" style={{ justifyContent: 'center', marginTop: '1.8rem' }}>
            {!showAnswer ? (
              <button 
                className="btn secondary" 
                style={{ minWidth: '280px' }} 
                onClick={handleValidateAnswer}
                disabled={question.type === 'mcq' ? !selectedOption : !userAnswer}
              >
                Valider
              </button>
            ) : (
              <button className="btn secondary" style={{ minWidth: '280px' }} onClick={handleNextQuestion}>
                {currentQuestionIndex === question_count - 1 ? 'Terminer le Quiz' : 'Question suivante →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default SoloGamePage
