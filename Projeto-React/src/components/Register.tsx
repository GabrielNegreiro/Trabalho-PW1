import { useState } from 'react'
import type { FormEvent } from 'react'
import { PasswordField } from './PasswordField'
import { useAuth } from '../context/AuthContext'
import type { NavigateTo } from '../types'

interface RegisterProps {
  goTo: NavigateTo
}

export function Register({ goTo }: RegisterProps) {
  const { register } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError('As senhas precisam ser iguais.')
      return
    }

    const success = register(username.trim(), email.trim(), password)
    if (!success) {
      setError('Este e-mail ja esta cadastrado.')
      return
    }

    setMessage('Conta criada. Agora voce ja pode entrar.')
    setUsername('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      <p className="eyebrow">Primeiro acesso</p>
      <h1>Criar conta</h1>
      <p className="muted">Cadastre um usuario para salvar tarefas no navegador.</p>

      <label>
        Nome de usuario
        <input value={username} onChange={event => setUsername(event.target.value)} required />
      </label>

      <label>
        E-mail
        <input value={email} onChange={event => setEmail(event.target.value)} type="email" required />
      </label>

      <label>
        Senha
        <PasswordField value={password} onChange={setPassword} />
      </label>

      <label>
        Confirmar senha
        <PasswordField value={confirmPassword} onChange={setConfirmPassword} />
      </label>

      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}

      <button className="primary-button" type="submit">
        Cadastrar
      </button>

      <div className="auth-links single">
        <button type="button" onClick={() => goTo('login')}>
          Ja possui conta?
        </button>
      </div>
    </form>
  )
}
