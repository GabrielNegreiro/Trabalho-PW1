import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { formatDateTime, formatSecurityEventType } from '../security'
import type { Task, User } from '../types'

export function AdminPanel() {
  const { currentUser, users, securityEvents, updateAnyUser, deleteUser } = useAuth()
  const [tasks] = useLocalStorage<Task[]>('taskflow_tasks', [])
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingUsername, setEditingUsername] = useState('')
  const [editingEmail, setEditingEmail] = useState('')
  const [userMessage, setUserMessage] = useState('')
  const [search, setSearch] = useState('')

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
    const confirmed = window.confirm(`Deseja realmente deletar o usuario ${user.email}?`)
    if (!confirmed) return

    deleteUser(user.id)
    setUserMessage(`Usuario ${user.email} deletado.`)
  }

  const filteredUsers = users.filter(user => {
    const term = search.trim().toLowerCase()
    if (!term) return true
    return user.username.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)
  })

  const getUserTaskStats = (userId: string) => {
    const userTasks = tasks.filter(task => task.userId === userId)
    const completed = userTasks.filter(task => task.completed || task.status === 'completed').length
    return {
      total: userTasks.length,
      pending: userTasks.length - completed,
      completed,
    }
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

        <div className="admin-toolbar">
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar usuario" />
        </div>

        <div className="user-table">
          <div className="user-table-row user-table-head">
            <span>Nome</span>
            <span>E-mail</span>
            <span>Senha</span>
            <span>Tarefas</span>
            <span>Acoes</span>
          </div>

          {filteredUsers.length === 0 && (
            <div className="empty-state enhanced">
              <strong>Nenhum usuario encontrado</strong>
              <span>Altere a busca para localizar outras contas.</span>
            </div>
          )}

          {filteredUsers.map(user => {
            const stats = getUserTaskStats(user.id)

            return (
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
                <span className="task-count">
                  {stats.total} total
                  <small>{stats.pending} pendentes / {stats.completed} concluidas</small>
                </span>
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
            )
          })}
        </div>

        {userMessage && <p className="form-success">{userMessage}</p>}
      </section>

      <section className="panel admin-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Seguranca</p>
            <h2>Historico de eventos</h2>
          </div>
          <span className="counter">{securityEvents.length} eventos</span>
        </div>

        <div className="security-event-list">
          {securityEvents.length === 0 && (
            <div className="empty-state enhanced">
              <strong>Nenhum evento registrado</strong>
              <span>Logins, cadastros e alteracoes de senha aparecerao aqui.</span>
            </div>
          )}

          {securityEvents.slice(0, 12).map(event => (
            <article className={`security-event ${event.type}`} key={event.id}>
              <div>
                <strong>{formatSecurityEventType(event.type)}</strong>
                <span>{event.message}</span>
              </div>
              <div>
                <span>{event.email}</span>
                <small>{formatDateTime(event.createdAt)}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
