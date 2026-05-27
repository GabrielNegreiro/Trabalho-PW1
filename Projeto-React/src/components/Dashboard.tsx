import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { Subtask, Task, TaskPriority, TaskStatus, User } from '../types'

interface DashboardProps {
  user: User
}

type TaskFilter = 'all' | 'pending' | 'completed' | 'overdue'
type TaskSort = 'newest' | 'oldest' | 'due-date' | 'priority'

const CATEGORIES = ['Geral', 'Estudos', 'Trabalho', 'Casa', 'Pessoal']
const PRIORITY_ORDER: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 }
const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Baixa',
  medium: 'Media',
  high: 'Alta',
}

export function Dashboard({ user }: DashboardProps) {
  const [tasks, setTasks] = useLocalStorage<Task[]>('taskflow_tasks', [])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [category, setCategory] = useState('Geral')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<TaskFilter>('all')
  const [sort, setSort] = useState<TaskSort>('newest')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingDescription, setEditingDescription] = useState('')
  const [editingDueDate, setEditingDueDate] = useState('')
  const [editingCategory, setEditingCategory] = useState('Geral')
  const [editingPriority, setEditingPriority] = useState<TaskPriority>('medium')
  const [subtaskDrafts, setSubtaskDrafts] = useState<Record<string, string>>({})

  const userTasks = useMemo(() => tasks.filter(task => task.userId === user.id), [tasks, user.id])
  const pendingCount = userTasks.filter(task => getTaskStatus(task) !== 'completed').length
  const completedCount = userTasks.filter(task => getTaskStatus(task) === 'completed').length
  const overdueCount = userTasks.filter(isOverdue).length
  const progress = userTasks.length ? Math.round((completedCount / userTasks.length) * 100) : 0

  const visibleTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return [...userTasks]
      .filter(task => {
        const status = getTaskStatus(task)
        if (filter === 'overdue') return isOverdue(task)
        if (filter !== 'all' && status !== filter) return false
        if (!normalizedSearch) return true

        return [task.title, task.description, task.category]
          .filter(Boolean)
          .some(value => value!.toLowerCase().includes(normalizedSearch))
      })
      .sort((first, second) => {
        if (sort === 'oldest') return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime()
        if (sort === 'due-date') return getDueTime(first) - getDueTime(second)
        if (sort === 'priority') return getPriorityValue(second) - getPriorityValue(first)
        return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
      })
  }, [filter, search, sort, userTasks])

  const addTask = (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return

    const newTask: Task = {
      id: crypto.randomUUID(),
      userId: user.id,
      title: title.trim(),
      description: description.trim() || undefined,
      completed: false,
      status: 'pending',
      priority,
      category,
      subtasks: [],
      dueDate: dueDate || undefined,
      createdAt: new Date().toISOString(),
    }

    setTasks(current => [newTask, ...current])
    setTitle('')
    setDescription('')
    setDueDate('')
    setCategory('Geral')
    setPriority('medium')
    setShowCreateForm(false)
  }

  const closeCreateForm = () => {
    setShowCreateForm(false)
    setTitle('')
    setDescription('')
    setDueDate('')
    setCategory('Geral')
    setPriority('medium')
  }

  const updateTask = (taskId: string, update: (task: Task) => Task) => {
    setTasks(current => current.map(task => (task.id === taskId ? update(task) : task)))
  }

  const toggleTask = (taskId: string) => {
    updateTask(taskId, task => {
      const nextCompleted = getTaskStatus(task) !== 'completed'
      return {
        ...task,
        completed: nextCompleted,
        status: nextCompleted ? 'completed' : 'pending',
      }
    })
  }

  const updateStatus = (taskId: string, status: TaskStatus) => {
    updateTask(taskId, task => ({
      ...task,
      status,
      completed: status === 'completed',
    }))
  }

  const removeTask = (taskId: string) => {
    const confirmed = window.confirm('Deseja realmente excluir esta tarefa?')
    if (!confirmed) return
    setTasks(current => current.filter(task => task.id !== taskId))
  }

  const startEditing = (task: Task) => {
    setEditingId(task.id)
    setEditingTitle(task.title)
    setEditingDescription(task.description ?? '')
    setEditingDueDate(task.dueDate ?? '')
    setEditingCategory(getCategory(task))
    setEditingPriority(getPriority(task))
  }

  const saveEditing = (taskId: string) => {
    if (!editingTitle.trim()) return

    updateTask(taskId, task => ({
      ...task,
      title: editingTitle.trim(),
      description: editingDescription.trim() || undefined,
      dueDate: editingDueDate || undefined,
      category: editingCategory,
      priority: editingPriority,
    }))
    setEditingId(null)
    setEditingTitle('')
    setEditingDescription('')
    setEditingDueDate('')
  }

  const addSubtask = (taskId: string) => {
    const draft = subtaskDrafts[taskId]?.trim()
    if (!draft) return

    const newSubtask: Subtask = {
      id: crypto.randomUUID(),
      title: draft,
      completed: false,
    }

    updateTask(taskId, task => ({ ...task, subtasks: [...(task.subtasks ?? []), newSubtask] }))
    setSubtaskDrafts(current => ({ ...current, [taskId]: '' }))
  }

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    updateTask(taskId, task => ({
      ...task,
      subtasks: (task.subtasks ?? []).map(subtask =>
        subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask,
      ),
    }))
  }

  const removeSubtask = (taskId: string, subtaskId: string) => {
    updateTask(taskId, task => ({
      ...task,
      subtasks: (task.subtasks ?? []).filter(subtask => subtask.id !== subtaskId),
    }))
  }

  return (
    <div className="dashboard-layout">
      {overdueCount > 0 && (
        <section className="overdue-alert">
          <strong>{overdueCount} tarefa(s) vencida(s)</strong>
          <span>Revise os prazos em vermelho para manter seu fluxo em dia.</span>
        </section>
      )}

      <div className="dashboard-grid">
        <section className="panel task-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Hoje</p>
              <h2>Lista de tarefas</h2>
            </div>
            <span className="counter">{pendingCount} pendentes</span>
          </div>

          {showCreateForm && (
            <div className="task-create-reveal">
              <form className="quick-task-form" onSubmit={addTask}>
                <div className="quick-task-heading">
                  <p className="eyebrow">Criacao rapida</p>
                  <h2>Nova tarefa</h2>
                </div>
                <input value={title} onChange={event => setTitle(event.target.value)} placeholder="Titulo da tarefa" autoFocus />
                <input value={dueDate} onChange={event => setDueDate(event.target.value)} type="date" />
                <select value={priority} onChange={event => setPriority(event.target.value as TaskPriority)}>
                  <option value="low">Baixa</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
                <select value={category} onChange={event => setCategory(event.target.value)}>
                  {CATEGORIES.map(item => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <textarea
                  value={description}
                  onChange={event => setDescription(event.target.value)}
                  placeholder="Descricao opcional"
                />
                <div className="quick-task-actions">
                  <button className="ghost-button" type="button" onClick={closeCreateForm}>
                    Cancelar
                  </button>
                  <button className="primary-button compact" type="submit">
                    Adicionar
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className={showCreateForm ? 'task-toolbar pushed' : 'task-toolbar'}>
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Pesquisar tarefas" />
            <select value={filter} onChange={event => setFilter(event.target.value as TaskFilter)}>
              <option value="all">Todas</option>
              <option value="pending">Pendentes</option>
              <option value="completed">Concluidas</option>
              <option value="overdue">Vencidas</option>
            </select>
            <select value={sort} onChange={event => setSort(event.target.value as TaskSort)}>
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigas</option>
              <option value="due-date">Por prazo</option>
              <option value="priority">Por prioridade</option>
            </select>
          </div>

          <div className="task-list">
            {visibleTasks.length === 0 && (
              <div className="empty-state enhanced">
                <strong>Nada por aqui</strong>
                <span>Crie uma tarefa ou ajuste filtros e pesquisa para encontrar o que procura.</span>
              </div>
            )}

            {visibleTasks.map(task => {
              const status = getTaskStatus(task)
              const taskSubtasks = task.subtasks ?? []
              const doneSubtasks = taskSubtasks.filter(subtask => subtask.completed).length

              return (
                <article
                  className={`task-item status-${status} priority-${getPriority(task)} ${isOverdue(task) ? 'overdue' : ''}`}
                  key={task.id}
                >
                  <input checked={status === 'completed'} onChange={() => toggleTask(task.id)} type="checkbox" />
                  <div className="task-content">
                    {editingId === task.id ? (
                      <div className="edit-stack">
                        <input
                          className="edit-input"
                          value={editingTitle}
                          onChange={event => setEditingTitle(event.target.value)}
                          autoFocus
                        />
                        <textarea
                          value={editingDescription}
                          onChange={event => setEditingDescription(event.target.value)}
                          placeholder="Descricao"
                        />
                        <div className="inline-fields">
                          <input value={editingDueDate} onChange={event => setEditingDueDate(event.target.value)} type="date" />
                          <select
                            value={editingPriority}
                            onChange={event => setEditingPriority(event.target.value as TaskPriority)}
                          >
                            <option value="low">Baixa</option>
                            <option value="medium">Media</option>
                            <option value="high">Alta</option>
                          </select>
                          <select value={editingCategory} onChange={event => setEditingCategory(event.target.value)}>
                            {CATEGORIES.map(item => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <>
                        <strong>{task.title}</strong>
                        {task.description && <p>{task.description}</p>}
                      </>
                    )}

                    <div className="task-meta">
                      <span>{task.dueDate ? `Prazo: ${formatDate(task.dueDate)}` : 'Sem data definida'}</span>
                      <span>{getCategory(task)}</span>
                      <span>{PRIORITY_LABELS[getPriority(task)]}</span>
                      {taskSubtasks.length > 0 && <span>{doneSubtasks}/{taskSubtasks.length} subtarefas</span>}
                    </div>

                    <div className="subtask-list">
                      {taskSubtasks.map(subtask => (
                        <label className="subtask-item" key={subtask.id}>
                          <input
                            checked={subtask.completed}
                            onChange={() => toggleSubtask(task.id, subtask.id)}
                            type="checkbox"
                          />
                          <span>{subtask.title}</span>
                          <button type="button" onClick={() => removeSubtask(task.id, subtask.id)}>
                            Remover
                          </button>
                        </label>
                      ))}
                    </div>

                    <div className="subtask-form">
                      <input
                        value={subtaskDrafts[task.id] ?? ''}
                        onChange={event => setSubtaskDrafts(current => ({ ...current, [task.id]: event.target.value }))}
                        placeholder="Nova subtarefa"
                      />
                      <button type="button" onClick={() => addSubtask(task.id)}>
                        Adicionar
                      </button>
                    </div>
                  </div>
                  <div className="task-actions">
                    <select value={status} onChange={event => updateStatus(task.id, event.target.value as TaskStatus)}>
                      <option value="pending">Pendente</option>
                      <option value="in-progress">Em andamento</option>
                      <option value="completed">Concluida</option>
                    </select>
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
              )
            })}
          </div>
        </section>

        <aside className="side-stack">
          <button
            className={showCreateForm ? 'primary-button new-task-button active' : 'primary-button new-task-button'}
            type="button"
            onClick={() => setShowCreateForm(current => !current)}
          >
            + Nova tarefa
          </button>

          <section className="panel stats-panel sticky-panel">
            <p className="eyebrow">Resumo</p>
            <h2>Progresso</h2>
            <div className="progress-ring" style={{ ['--progress' as string]: `${progress}%` }}>
              <strong>{progress}%</strong>
              <span>concluido</span>
            </div>
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
            <div className="stat-card danger-stat">
              <span>Vencidas</span>
              <strong>{overdueCount}</strong>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

function getTaskStatus(task: Task): TaskStatus {
  if (task.status) return task.status
  return task.completed ? 'completed' : 'pending'
}

function getPriority(task: Task): TaskPriority {
  return task.priority ?? 'medium'
}

function getPriorityValue(task: Task) {
  return PRIORITY_ORDER[getPriority(task)]
}

function getCategory(task: Task) {
  return task.category || 'Geral'
}

function getDueTime(task: Task) {
  return task.dueDate ? new Date(`${task.dueDate}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER
}

function isOverdue(task: Task) {
  if (!task.dueDate || getTaskStatus(task) === 'completed') return false
  return task.dueDate < toInputDate(new Date())
}

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(date))
}
