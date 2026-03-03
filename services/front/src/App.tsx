import { Routes, Route, Navigate } from 'react-router-dom'
import type { ReactElement } from 'react'
import HomePage from './pages/Home'
import QuizPage from './pages/Quiz'
import SoloGameSetup from './pages/SoloGameSetup'
import SoloGamePage from './pages/SoloGame'
import MultiPlayerCodeRoom from './pages/MultiPlayerCodeRoom'
import JoinGame from './pages/JoinGame'
import ProfilUser from './pages/ProfilUser'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ThemeRetriever from './content/ThemeRetriever'

function RequireAuth({ children }: { children: ReactElement }) {
  const { isAuthenticated, isAuthReady } = useAuth()

  if (!isAuthReady)
    return (null)

  if (!isAuthenticated)
    return <Navigate to="/" replace />

  return (children)
}

function App() {
  return (
    <AuthProvider>
      <ThemeRetriever />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quiz" element={<RequireAuth><QuizPage /></RequireAuth>} />
        <Route path="/quiz/solo-setup" element={<RequireAuth><SoloGameSetup /></RequireAuth>} />
        <Route path="/quiz/solo" element={<RequireAuth><SoloGamePage /></RequireAuth>} />

        <Route path="/quiz/multi" element={<RequireAuth><MultiPlayerCodeRoom /></RequireAuth>} />
        <Route path="/quiz/multi/:roomCode" element={<RequireAuth><MultiPlayerCodeRoom /></RequireAuth>} />
        <Route path="/quiz/join" element={<RequireAuth><JoinGame /></RequireAuth>} />
        
        <Route path="/profile" element={<ProfilUser />} />
        <Route path="/profile/:username" element={<ProfilUser />} />

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </AuthProvider>
  )
}

export default App
