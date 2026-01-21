import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import '../App.css'

interface Question {
  question: string
  type: 'mcq' | 'text'
  response: string
  options?: string[]
  variants?: string[]
  difficulty: string
}

interface QuizData {
  Quiz: Array<Record<string, Question[]>>
}

function shuffleQuestions(items: Question[]) {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function normalizeAnswer(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a: string, b: string) {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[a.length][b.length]
}

function isTextAnswerCorrect(question: Question, answer: string) {
  const accepted = [question.response, ...(question.variants ?? [])]
  const normalizedUser = normalizeAnswer(answer)
  const normalizedAccepted = accepted.map((value) => normalizeAnswer(value))

  return normalizedAccepted.some((target) => {
    if (target === normalizedUser) return true

    // Tolérer les responses quasi-identiques (accents/typos légers)
    const distance = levenshtein(target, normalizedUser)
    const tolerance = Math.max(1, Math.floor(target.length * 0.2))
    if (distance <= tolerance) return true

    // Tolérer une inclusion forte (ex: on tape juste le nom principal)
    if (normalizedUser.length >= 4 && (target.includes(normalizedUser) || normalizedUser.includes(target))) {
      return true
    }

    return false
  })
}

const STORAGE_KEY = 'soloGameState:v1'

function SoloGamePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [score, setScore] = useState(0)

  useEffect(() => {
    // Si un état est sauvegardé, le restaurer immédiatement pour éviter un reset au refresh
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.questions?.length) {
          setQuestions(parsed.questions)
          setCurrentQuestionIndex(parsed.currentQuestionIndex ?? 0)
          setUserAnswer(parsed.userAnswer ?? '')
          setSelectedOption(parsed.selectedOption ?? null)
          setScore(parsed.score ?? 0)
          setLoading(false)
          return
        }
      } catch (err) {
        console.warn('[SoloGame] failed to restore saved state', err)
      }
    }

    // Charger les questions depuis le backend si aucun état sauvegardé
    const fetchQuestions = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/questions/?lang=fr')
        if (!response.ok) {
          throw new Error('Failed to fetch questions')
        }
        const data: QuizData = await response.json()

        // Extraire toutes les questions de toutes les catégories
        const allQuestions: Question[] = []
        const seenQuestions = new Set<string>()
        if (data.Quiz && data.Quiz.length > 0) {
          const quizData = data.Quiz[0]
          for (const category in quizData) {
            quizData[category].forEach((question) => {
              if (!seenQuestions.has(question.question)) {
                seenQuestions.add(question.question)
                allQuestions.push(question)
              }
            })
          }
        }

        setQuestions(shuffleQuestions(allQuestions))
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : t('error_occurred'))
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [])

  useEffect(() => {
    if (loading || error || questions.length === 0) return

    const payload = {
      questions,
      currentQuestionIndex,
      userAnswer,
      selectedOption,
      score,
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch (err) {
      console.warn('[SoloGame] failed to persist state', err)
    }
  }, [questions, currentQuestionIndex, userAnswer, selectedOption, loading, error, score])

  const handleNextQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex]

    let isCorrect = false

    // si pas de reponse on met faux directement
    if (currentQuestion.type === 'mcq') {
      isCorrect = selectedOption
        ? normalizeAnswer(selectedOption) === normalizeAnswer(currentQuestion.response)
        : false
    } else {
      isCorrect = isTextAnswerCorrect(currentQuestion, userAnswer)
    }

    const isLastQuestion = currentQuestionIndex === questions.length - 1
    const finalScore = isCorrect ? score + 1 : score

    setScore(finalScore)

    if (isLastQuestion) {
      localStorage.removeItem(STORAGE_KEY)
      alert(`Quiz terminé ! Score: ${finalScore} / ${questions.length}`)
      navigate('/quiz')
      return
    }

    setCurrentQuestionIndex(currentQuestionIndex + 1)
    setUserAnswer('')
    setSelectedOption(null)
  }

  const handleOptionClick = (option: string) => {
    setSelectedOption(option)
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

  if (questions.length === 0) {
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

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <main className="page">
      <div className="shell">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p className="eyebrow">Quiz Sprint - Mode Solo</p>
          <button
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY)
              navigate('/quiz')
            }}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.8rem',
              cursor: 'pointer',
              padding: '0.5rem',
              lineHeight: 1,
              opacity: 0.6,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
            title="Quitter la partie"
          >
            🚪
          </button>
        </div>
        <div className="hero">
          <div className="copy">
            <h1>Partie Solo en cours</h1>
              <p className="lede">Question {currentQuestionIndex + 1} sur {questions.length} • Score : {score}</p>

            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              /*ici pour mettre une box/card de couleurs autour des questions*/
              backgroundColor: '#ffffffff',
              borderRadius: '8px',
              textAlign: 'left',
              position: 'relative',
              maxWidth: '100%',
              overflow: 'hidden'
            }}>
              <h2 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>
                {currentQuestion.question}
              </h2>

              <div style={{ marginTop: '1.5rem' }}>
                {currentQuestion.type === 'mcq' && currentQuestion.options ? (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '1rem' 
                  }}>
                    {currentQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleOptionClick(option)}
                        style={{
                          padding: '1rem',
                          fontSize: '1rem',
                          borderRadius: '8px',
                          border: selectedOption === option ? '5px solid #4CAF50' : '2px solid #ddd',
                          backgroundColor: selectedOption === option ? '#ffffffff' : '#fff',
                          color: '#000',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontWeight: selectedOption === option ? 'bold' : 'normal',
                          wordWrap: 'break-word'
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Votre response..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleNextQuestion()
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '1rem',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      marginBottom: '1rem',
                      boxSizing: 'border-box'
                    }}
                  />
                )}
              </div>
            </div>

            <div className="actions">
              <button className="btn primary" onClick={handleNextQuestion}>
                {currentQuestionIndex === questions.length - 1 ? 'Terminer' : 'Question suivante'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default SoloGamePage
