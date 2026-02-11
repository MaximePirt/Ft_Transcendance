import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/Home'
import QuizPage from './pages/Quiz'
import SoloGameSetup from './pages/SoloGameSetup'
import SoloGamePage from './pages/SoloGame'
import MultiPlayerCodeRoom from './pages/MultiPlayerCodeRoom'
import JoinGame from './pages/JoinGame'
import ProfilUser from './pages/ProfilUser'
import { AuthProvider } from './contexts/AuthContext'
import ThemeRetriever from './content/ThemeRetriever'

function App() {
  return (
    <AuthProvider>
      <ThemeRetriever />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/quiz/solo-setup" element={<SoloGameSetup />} />
        <Route path="/quiz/solo" element={<SoloGamePage />} />

        <Route path="/quiz/multi" element={<MultiPlayerCodeRoom />} />
        <Route path="/quiz/multi/:roomCode" element={<MultiPlayerCodeRoom />} />
        <Route path="/quiz/join" element={<JoinGame />} />
        
        <Route path="/user" element={<ProfilUser />} />
        <Route path="/user/:username" element={<ProfilUser />} />

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </AuthProvider>
  )
}

export default App
