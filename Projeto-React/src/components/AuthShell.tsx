import { ForgotPassword } from './ForgotPassword'
import { Login } from './Login'
import { Register } from './Register'
import { ThemeToggle } from './ThemeToggle'
import type { AppView, NavigateTo, ThemeSetter } from '../types'

interface AuthShellProps {
  darkMode: boolean
  setDarkMode: ThemeSetter
  view: AppView
  goTo: NavigateTo
}

export function AuthShell({ darkMode, setDarkMode, view, goTo }: AuthShellProps) {
  return (
    <section className="auth-shell">
      <div className="auth-background" />
      <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="auth-brand">
        <div className="brand-mark">TF</div>
        <div>
          <strong>TaskFlow</strong>
          <span>Organize tarefas com clareza.</span>
        </div>
      </div>
      {view === 'register' && <Register goTo={goTo} />}
      {view === 'forgot' && <ForgotPassword goTo={goTo} />}
      {(view === 'login' || view === 'dashboard' || view === 'settings') && <Login goTo={goTo} />}
    </section>
  )
}
