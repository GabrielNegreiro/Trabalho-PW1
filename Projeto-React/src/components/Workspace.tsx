import { AdminPanel } from './AdminPanel'
import { Dashboard } from './Dashboard'
import { Settings } from './Settings'
import { ThemeToggle } from './ThemeToggle'
import { UserBadge } from './UserBadge'
import { useAuth } from '../context/AuthContext'
import type { NavigateTo, ThemeSetter } from '../types'

interface WorkspaceProps {
  darkMode: boolean
  setDarkMode: ThemeSetter
  view: 'dashboard' | 'settings' | 'admin'
  goTo: NavigateTo
}

export function Workspace({ darkMode, setDarkMode, view, goTo }: WorkspaceProps) {
  const { currentUser, logout } = useAuth()

  if (!currentUser) return null

  const isAdmin = currentUser.id === '1'

  const handleLogout = () => {
    logout()
    goTo('login')
  }

  return (
    <section className="workspace">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">TF</div>
          <div>
            <strong>TaskFlow</strong>
            <span>Dashboard</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className={view === 'dashboard' ? 'active' : ''} type="button" onClick={() => goTo('dashboard')}>
            Tarefas
          </button>
          <button className={view === 'settings' ? 'active' : ''} type="button" onClick={() => goTo('settings')}>
            Configuracoes
          </button>
          {isAdmin && (
            <button className={view === 'admin' ? 'active' : ''} type="button" onClick={() => goTo('admin')}>
              Admin
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
          <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
          <button className="ghost-button" type="button" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </aside>

      <div className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Area de trabalho</p>
            <h1>{getPageTitle(view)}</h1>
          </div>
          <UserBadge user={currentUser} />
        </header>

        {view === 'dashboard' && <Dashboard user={currentUser} />}
        {view === 'settings' && <Settings onLogout={handleLogout} />}
        {view === 'admin' && <AdminPanel />}
      </div>
    </section>
  )
}

function getPageTitle(view: 'dashboard' | 'settings' | 'admin') {
  if (view === 'settings') return 'Configuracoes'
  if (view === 'admin') return 'Painel admin'
  return 'Minhas tarefas'
}
