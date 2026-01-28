import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/Home'
import QuizPage from './pages/Quiz'
import SoloGameSetup from './pages/SoloGameSetup'
import SoloGamePage from './pages/SoloGame'
import MultiPlayerCodeRoom from './pages/MultiPlayerCodeRoom'
import JoinGame from './pages/JoinGame'
import ProfilUser from './pages/ProfilUser'

function App() {
  console.debug('[App] render')

  // Lien de la page, sert pour le SPA et pour les room code du multi/ du site en entier, faut voir dans Quizz.tsx la plupart sont utiliser de la bas pour l'instant
  return (
    <div data-test="app-root">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/quiz/solo-setup" element={<SoloGameSetup />} />
        <Route path="/quiz/solo" element={<SoloGamePage />} />

        <Route path="/quiz/multi" element={<MultiPlayerCodeRoom />} />
        <Route path="/quiz/multi/:roomCode" element={<MultiPlayerCodeRoom />} />
        <Route path="/quiz/join" element={<JoinGame />} />
        
        <Route path="/user" element={<ProfilUser />} />
        {/* <Route path="/quiz/user=:username" element={<ProfilUser />} /> */}

      </Routes>
    </div>
  )
}

export default App
