import { useState } from 'react'
import { AuthShell } from './components/AuthShell'
import { Workspace } from './components/Workspace'
import { useAuth } from './context/AuthContext'
import { useLocalStorage } from './hooks/useLocalStorage'
import type { AppView } from './types'

function App() {
  const { currentUser } = useAuth()
  const [view, setView] = useState<AppView>(currentUser ? 'dashboard' : 'login')
  const [darkMode, setDarkMode] = useLocalStorage('taskflow_dark_mode', false)

  const goTo = (nextView: AppView) => setView(nextView)

  return (
    <main className={darkMode ? 'app dark' : 'app'}>
      {currentUser ? (
        <Workspace
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          view={view === 'settings' || view === 'admin' ? view : 'dashboard'}
          goTo={goTo}
        />
      ) : (
        <AuthShell darkMode={darkMode} setDarkMode={setDarkMode} view={view} goTo={goTo} />
      )}
    </main>
  )
}

export default App
