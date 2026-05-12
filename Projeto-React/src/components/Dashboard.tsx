import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { Task, User } from '../types'

interface DashboardProps {
  user: User
}

export function Dashboard({ user }: DashboardProps) {
  const [tasks, setTasks] = useLocalStorage<Task[]>('taskflow_tasks', [])
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const userTasks = useMemo(() => tasks.filter(task => task.userId === user.id), [tasks, user.id])
  const pendingCount = userTasks.filter(task => !task.completed).length
  const completedCount = userTasks.length - pendingCount

  const addTask = (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return

    const newTask: Task = {
      id: crypto.randomUUID(),
      userId: user.id,
      title: title.trim(),
      completed: false,
      dueDate: dueDate || undefined,
      createdAt: new Date().toISOString(),
    }

    setTasks(current => [newTask, ...current])
    setTitle('')
    setDueDate('')
  }

  const toggleTask = (taskId: string) => {
    setTasks(current => current.map(task => (task.id === taskId ? { ...task, completed: !task.completed } : task)))
  }

  const removeTask = (taskId: string) => {
    setTasks(current => current.filter(task => task.id !== taskId))
  }

  const startEditing = (task: Task) => {
    setEditingId(task.id)
    setEditingTitle(task.title)
  }

  const saveEditing = (taskId: string) => {
    if (!editingTitle.trim()) return
    setTasks(current => current.map(task => (task.id === taskId ? { ...task, title: editingTitle.trim() } : task)))
    setEditingId(null)
    setEditingTitle('')
  }

  return (
    <div className="dashboard-grid">
      <section className="panel task-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Hoje</p>
            <h2>Lista de tarefas</h2>
          </div>
          <span className="counter">{pendingCount} pendentes</span>
        </div>

        <form className="task-form" onSubmit={addTask}>
          <input value={title} onChange={event => setTitle(event.target.value)} placeholder="Adicionar nova tarefa" />
          <input value={dueDate} onChange={event => setDueDate(event.target.value)} type="date" />
          <button className="primary-button compact" type="submit">
            Adicionar
          </button>
        </form>

        <div className="task-list">
          {userTasks.length === 0 && (
            <div className="empty-state">
              <strong>Nenhuma tarefa ainda</strong>
              <span>Adicione sua primeira tarefa para comecar o fluxo.</span>
            </div>
          )}

          {userTasks.map(task => (
            <article className={task.completed ? 'task-item completed' : 'task-item'} key={task.id}>
              <input checked={task.completed} onChange={() => toggleTask(task.id)} type="checkbox" />
              <div className="task-content">
                {editingId === task.id ? (
                  <input
                    className="edit-input"
                    value={editingTitle}
                    onChange={event => setEditingTitle(event.target.value)}
                    autoFocus
                  />
                ) : (
                  <strong>{task.title}</strong>
                )}
                <span>{task.dueDate ? `Prazo: ${formatDate(task.dueDate)}` : 'Sem data definida'}</span>
              </div>
              <div className="task-actions">
                {editingId === task.id ? (
                  <button type="button" onClick={() => saveEditing(task.id)}>
                    Salvar
                  </button>
                ) : (
                  <button type="button" onClick={() => startEditing(task)}>
                    Editar
                  </button>
                )}
                <button type="button" onClick={() => removeTask(task.id)}>
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="panel stats-panel">
        <p className="eyebrow">Resumo</p>
        <h2>Progresso</h2>
        <div className="stat-card">
          <span>Total</span>
          <strong>{userTasks.length}</strong>
        </div>
        <div className="stat-card">
          <span>Pendentes</span>
          <strong>{pendingCount}</strong>
        </div>
        <div className="stat-card">
          <span>Concluidas</span>
          <strong>{completedCount}</strong>
        </div>
      </aside>
    </div>
  )
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(date))
}
