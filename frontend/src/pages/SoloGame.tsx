import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import '../App.css'

interface Question {
  question: string
  type: 'qcm' | 'texte'
  réponse: string
  options?: string[]
  difficulté: string
}

interface QuizData {
  Quiz: Array<Record<string, Question[]>>
}

function SoloGamePage() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  useEffect(() => {
    // Charger les questions depuis le backend
    const fetchQuestions = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/questions/?lang=fr')
        if (!response.ok) {
          throw new Error('Failed to fetch questions')
        }
        const data: QuizData = await response.json()

        // Extraire toutes les questions de toutes les catégories
        const allQuestions: Question[] = []
        if (data.Quiz && data.Quiz.length > 0) {
          const quizData = data.Quiz[0]
          for (const category in quizData) {
            allQuestions.push(...quizData[category])
          }
        }

        setQuestions(allQuestions)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [])

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setUserAnswer('')
      setSelectedOption(null)
    } else {
      // Fin du quiz
      alert('Quiz terminé!')
      navigate('/quiz')
    }
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
        <p className="eyebrow">Quiz Sprint - Mode Solo</p>
        <div className="hero">
          <div className="copy">
            <h1>Partie Solo en cours</h1>
            <p className="lede">Question {currentQuestionIndex + 1} sur {questions.length}</p>

            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              /*ici pour mettre une box/card de couleurs autour des questions*/
              backgroundColor: '#ffffffff',
              borderRadius: '8px',
              textAlign: 'left'
            }}>
              <h2 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>
                {currentQuestion.question}
              </h2>

              <div style={{ marginTop: '1.5rem' }}>
                {currentQuestion.type === 'qcm' && currentQuestion.options ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                          fontWeight: selectedOption === option ? 'bold' : 'normal'
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Votre réponse..."
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
