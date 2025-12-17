import HomePage from './pages/Home'

function App() {
  console.debug('[App] render')
  return (
    <div data-test="app-root">
      <HomePage />
    </div>
  )
}

export default App
