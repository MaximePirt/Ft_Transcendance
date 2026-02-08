import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/Home'
import QuizPage from './pages/Quiz'
import SoloGameSetup from './pages/SoloGameSetup'
import SoloGamePage from './pages/SoloGame'
import MultiPlayerCodeRoom from './pages/MultiPlayerCodeRoom'
import JoinGame from './pages/JoinGame'
import ProfilUser from './pages/ProfilUser'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/quiz/solo-setup" element={<SoloGameSetup />} />
        <Route path="/quiz/solo" element={<SoloGamePage />} />

        <Route path="/quiz/multi" element={<MultiPlayerCodeRoom />} />
        <Route path="/quiz/multi/:roomCode" element={<MultiPlayerCodeRoom />} />
        <Route path="/quiz/join" element={<JoinGame />} />
        
        <Route path="/profile" element={<ProfilUser />} />
        <Route path="/profile/:username" element={<ProfilUser />} />

      </Routes>
    </AuthProvider>
  )
}

export default App
