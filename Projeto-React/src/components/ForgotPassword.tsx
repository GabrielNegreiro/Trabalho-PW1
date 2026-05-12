import { useState } from 'react'
import type { FormEvent } from 'react'
import type { NavigateTo } from '../types'

interface ForgotPasswordProps {
  goTo: NavigateTo
}

export function ForgotPassword({ goTo }: ForgotPasswordProps) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setSent(true)
  }

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      <p className="eyebrow">Recuperacao</p>
      <h1>Redefinir senha</h1>
      <p className="muted">
        Informe o e-mail para simular a recuperacao de senha. Como este projeto e somente frontend, nenhum e-mail real
        sera enviado.
      </p>

      <label>
        E-mail
        <input value={email} onChange={event => setEmail(event.target.value)} type="email" required />
      </label>

      {sent && (
        <p className="info-box">
          Simulacao: em uma versao com backend, um servidor SMTP local enviaria um codigo de redefinicao para {email}.
        </p>
      )}

      <button className="primary-button" type="submit">
        Enviar codigo
      </button>

      <div className="auth-links single">
        <button type="button" onClick={() => goTo('login')}>
          Voltar para login
        </button>
      </div>
    </form>
  )
}
