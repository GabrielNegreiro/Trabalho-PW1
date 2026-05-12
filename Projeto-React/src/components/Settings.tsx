import { useState } from 'react'
import type { FormEvent } from 'react'
import { PasswordField } from './PasswordField'
import { DEFAULT_AVATAR } from '../constants'
import { useAuth } from '../context/AuthContext'

interface SettingsProps {
  onLogout: () => void
}

export function Settings({ onLogout }: SettingsProps) {
  const { currentUser, updateUser } = useAuth()
  const [username, setUsername] = useState(currentUser?.username ?? '')
  const [email, setEmail] = useState(currentUser?.email ?? '')
  const [password, setPassword] = useState(currentUser?.password ?? '')
  const [avatar, setAvatar] = useState(currentUser?.avatar ?? '')
  const [message, setMessage] = useState('')

  if (!currentUser) return null

  const saveSettings = (event: FormEvent) => {
    event.preventDefault()
    updateUser({ ...currentUser, username: username.trim(), email: email.trim(), password, avatar: avatar.trim() })
    setMessage('Alteracoes salvas com sucesso.')
  }

  return (
    <section className="panel settings-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Perfil</p>
          <h2>Dados do usuario</h2>
        </div>
        <img className="settings-avatar" src={avatar || DEFAULT_AVATAR} alt="Avatar atual" />
      </div>

      <form className="settings-form" onSubmit={saveSettings}>
        <label>
          Alterar nome de usuario
          <input value={username} onChange={event => setUsername(event.target.value)} required />
        </label>

        <label>
          Alterar e-mail
          <input value={email} onChange={event => setEmail(event.target.value)} type="email" required />
        </label>

        <label>
          Alterar senha
          <PasswordField value={password} onChange={setPassword} />
        </label>

        <label>
          Alterar foto/avatar
          <input value={avatar} onChange={event => setAvatar(event.target.value)} placeholder="Cole a URL da imagem" />
        </label>

        {message && <p className="form-success">{message}</p>}

        <div className="settings-actions">
          <button className="primary-button" type="submit">
            Salvar alteracoes
          </button>
          <button className="ghost-button danger" type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </form>
    </section>
  )
}
