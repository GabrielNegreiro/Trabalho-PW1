import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { User } from '../types'

export function AdminPanel() {
  const { currentUser, users, updateAnyUser, deleteUser } = useAuth()
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingUsername, setEditingUsername] = useState('')
  const [editingEmail, setEditingEmail] = useState('')
  const [userMessage, setUserMessage] = useState('')

  if (!currentUser || currentUser.id !== '1') {
    return (
      <section className="panel">
        <p className="eyebrow">Acesso restrito</p>
        <h2>Painel administrativo</h2>
        <p className="muted">Somente o usuario administrador pode acessar esta area.</p>
      </section>
    )
  }

  const startEditingUser = (user: User) => {
    setEditingUserId(user.id)
    setEditingUsername(user.username)
    setEditingEmail(user.email)
    setUserMessage('')
  }

  const saveUser = (user: User) => {
    updateAnyUser({
      ...user,
      username: editingUsername.trim(),
      email: editingEmail.trim(),
    })
    setEditingUserId(null)
    setUserMessage('Usuario atualizado.')
  }

  const removeUser = (user: User) => {
    deleteUser(user.id)
    setUserMessage(`Usuario ${user.email} deletado.`)
  }

  return (
    <div className="admin-grid single">
      <section className="panel admin-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Usuarios</p>
            <h2>Contas cadastradas</h2>
          </div>
          <span className="counter">{users.length} contas</span>
        </div>

        <div className="user-table">
          <div className="user-table-row user-table-head">
            <span>Nome</span>
            <span>E-mail</span>
            <span>Senha</span>
            <span>Acoes</span>
          </div>

          {users.map(user => (
            <div className="user-table-row" key={user.id}>
              {editingUserId === user.id ? (
                <>
                  <input value={editingUsername} onChange={event => setEditingUsername(event.target.value)} />
                  <input value={editingEmail} onChange={event => setEditingEmail(event.target.value)} type="email" />
                </>
              ) : (
                <>
                  <span>{user.username}</span>
                  <span>{user.email}</span>
                </>
              )}
              <span>{user.password}</span>
              <div className="admin-actions">
                {editingUserId === user.id ? (
                  <>
                    <button type="button" onClick={() => saveUser(user)}>
                      Salvar
                    </button>
                    <button type="button" onClick={() => setEditingUserId(null)}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => startEditingUser(user)}>
                    Editar
                  </button>
                )}
                {user.id !== '1' && (
                  <button className="danger" type="button" onClick={() => removeUser(user)}>
                    Deletar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {userMessage && <p className="form-success">{userMessage}</p>}
      </section>
    </div>
  )
}
