import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/Home'
import QuizPage from './pages/Quiz'
import SoloGameSetup from './pages/SoloGameSetup'
import SoloGamePage from './pages/SoloGame'
import MultiPlayerCodeRoom from './pages/MultiPlayerCodeRoom'
import MultiPlayerSetup from './pages/MultiGameSetup'
import JoinGame from './pages/JoinGame'
import ProfilUser from './pages/ProfilUser'
import { AuthProvider } from './contexts/AuthContext'
import ThemeRetriever from './content/ThemeRetriever'
import EndGame from './pages/EndGame'

function App() {
  return (
    <AuthProvider>
      <ThemeRetriever />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/quiz/solo-setup" element={<SoloGameSetup />} />
        <Route path="/quiz/solo" element={<SoloGamePage />} />

        <Route path="/quiz/multi-setup" element={<MultiPlayerSetup />} />
        <Route path="/quiz/multi" element={<MultiPlayerCodeRoom />} />
        <Route path="/quiz/multi/:roomCode" element={<MultiPlayerCodeRoom />} />
        <Route path="/quiz/join" element={<JoinGame />} />
        <Route path="/quiz/end" element={<EndGame />} />

        <Route path="/profile" element={<ProfilUser />} />
        <Route path="/profile/:username" element={<ProfilUser />} />

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </AuthProvider>
  )
}

export default App
