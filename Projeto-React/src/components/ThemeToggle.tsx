import type { ThemeSetter } from '../types'

interface ThemeToggleProps {
  darkMode: boolean
  setDarkMode: ThemeSetter
}

export function ThemeToggle({ darkMode, setDarkMode }: ThemeToggleProps) {
  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={() => setDarkMode(current => !current)}
      aria-label="Alternar tema"
    >
      <span>{darkMode ? 'Claro' : 'Escuro'}</span>
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
    </button>
  )
}
