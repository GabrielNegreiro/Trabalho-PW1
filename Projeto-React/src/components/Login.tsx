import { useState } from 'react'
import type { FormEvent } from 'react'
import { PasswordField } from './PasswordField'
import { useAuth } from '../context/AuthContext'
import type { NavigateTo } from '../types'

interface LoginProps {
  goTo: NavigateTo
}

export function Login({ goTo }: LoginProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const success = login(email.trim(), password)
    if (!success) setError('E-mail ou senha incorretos.')
  }

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      <p className="eyebrow">Bem-vindo de volta</p>
      <h1>Entre na sua conta</h1>
      <p className="muted">Use seu acesso local para gerenciar suas tarefas.</p>

      <label>
        E-mail
        <input value={email} onChange={event => setEmail(event.target.value)} type="email" required />
      </label>

      <label>
        Senha
        <PasswordField value={password} onChange={setPassword} />
      </label>

      {error && <p className="form-error">{error}</p>}

      <button className="primary-button" type="submit">
        Entrar
      </button>

      <div className="auth-links">
        <button type="button" onClick={() => goTo('forgot')}>
          Esqueci minha senha
        </button>
        <button type="button" onClick={() => goTo('register')}>
          Criar conta
        </button>
      </div>
    </form>
  )
}
