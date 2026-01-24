import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import '../App.css'

interface Question {
  question: string
  type: 'qcm' | 'texte'
  réponse: string
  options?: string[]
  variantes?: string[]
  difficulté: string
  theme: string
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
  const accepted = [question.réponse, ...(question.variantes ?? [])]
  const normalizedUser = normalizeAnswer(answer)
  const normalizedAccepted = accepted.map((value) => normalizeAnswer(value))

  return normalizedAccepted.some((target) => {
    if (target === normalizedUser) return true

    // Tolérer les réponses quasi-identiques (accents/typos légers)
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

// appliquer le style dans le DOM en fonction du theme de la question
async function applyTheme(themeName: string) {
  console.log(`${themeName}.json`)
  try {
    const res = await fetch(`/themes/${themeName}.json`)
    const theme = await res.json()

    const root = document.documentElement
    Object.entries(theme.variables).forEach(([key, value]) => {
      root.style.setProperty(key, value as string)
    })

  } catch (err) {
    console.error(`Erreur lors du chargement du thème "${themeName}"`, err)
    if (themeName !== 'default')
      return applyTheme('default')
    return
  }
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
  const [showAnswer, setShowAnswer] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

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
          setShowAnswer(false)
          setIsCorrect(false)
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
                allQuestions.push({
                ...question,
                theme: category ? category.toLowerCase() : 'default',
              })
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

  const handleValidateAnswer = () => {
    const currentQuestion = questions[currentQuestionIndex]
    let correct = false

    if (currentQuestion.type === 'qcm') {
      correct = selectedOption
        ? normalizeAnswer(selectedOption) === normalizeAnswer(currentQuestion.réponse)
        : false
    } else {
      correct = isTextAnswerCorrect(currentQuestion, userAnswer)
    }

    setIsCorrect(correct)
    setShowAnswer(true)
    if (correct) {
      setScore(score + 1)
    }
  }

  const handleNextQuestion = () => {
    const isLastQuestion = currentQuestionIndex === questions.length - 1

    if (isLastQuestion) {
      localStorage.removeItem(STORAGE_KEY)
      alert(`Quiz terminé ! Score: ${score} / ${questions.length}`)
      navigate('/quiz')
      return
    }

    setCurrentQuestionIndex(currentQuestionIndex + 1)
    setUserAnswer('')
    setSelectedOption(null)
    setShowAnswer(false)
    setIsCorrect(false)
  }

  const handleOptionClick = (option: string) => {
    if (!showAnswer) {
      setSelectedOption(option)
    }
  }

  const currentQuestion = questions[currentQuestionIndex]
  useEffect(() => {
    if (!currentQuestion || !currentQuestion?.theme) return
    
    applyTheme(currentQuestion.theme || 'default')
  }, [currentQuestion])

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

return (
  <main className="page">
    <div className="shell">
      {/* Header du Quiz */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px' }}>
        <p className="eyebrow">Quiz Sprint - Mode Solo</p>
        <button
          className="btn-close-exit" 
          onClick={() => {
            applyTheme("default")
            localStorage.removeItem(STORAGE_KEY)
            navigate('/quiz')
          }}
          title="Quitter la partie"
          style={{ background: 'none', border: 'none', fontSize: '2.2rem', cursor: 'pointer', padding: '0', lineHeight: '1' }}
        >
          🚪
        </button>
      </div>

      {/* Zone de Titre */}
      <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
        <h1>Partie Solo en cours</h1>
        <p className="lede" style={{ border: 'none', padding: 0, textAlign: 'center' }}>
          Question <strong>{currentQuestionIndex + 1}</strong> sur {questions.length} • Score : <strong>{score}</strong>
        </p>
      </div>

      {/* LA CARTE DE JEU (Pleine largeur) */}
      <div className="quiz-card-full">
        <h2 style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '1.4rem' }}>
          {currentQuestion.question}
        </h2>

        <div className="game-area">
          {currentQuestion.type === 'qcm' && currentQuestion.options ? (
            <div className="game-options-grid">
              {currentQuestion.options.map((option, index) => {
                const isCorrectAnswer = normalizeAnswer(option) === normalizeAnswer(currentQuestion.réponse)
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
                      opacity: showAnswer && !isCorrectAnswer && !isSelected ? 0.6 : 1
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
              {showAnswer && !isCorrect && (
                <p style={{ marginTop: '12px', fontSize: '15px', color: '#4CAF50', fontWeight: 'bold' }}>
                  Bonne réponse : {currentQuestion.réponse}
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
              disabled={currentQuestion.type === 'qcm' ? !selectedOption : !userAnswer}
            >
              Valider
            </button>
          ) : (
            <button className="btn secondary" style={{ minWidth: '280px' }} onClick={handleNextQuestion}>
              {currentQuestionIndex === questions.length - 1 ? 'Terminer le Quiz' : 'Question suivante →'}
            </button>
          )}
        </div>
      </div>
    </div>
  </main>
)
}

export default SoloGamePage
