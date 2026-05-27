import { useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { Task, TaskPriority, TaskStatus, User } from '../types'

interface ChartsPageProps {
  user: User
}

const CATEGORIES = ['Geral', 'Estudos', 'Trabalho', 'Casa', 'Pessoal']
const PRIORITIES: Array<{ label: string; value: TaskPriority }> = [
  { label: 'Alta', value: 'high' },
  { label: 'Media', value: 'medium' },
  { label: 'Baixa', value: 'low' },
]

export function ChartsPage({ user }: ChartsPageProps) {
  const [tasks] = useLocalStorage<Task[]>('taskflow_tasks', [])
  const userTasks = useMemo(() => tasks.filter(task => task.userId === user.id), [tasks, user.id])
  const completed = userTasks.filter(task => getTaskStatus(task) === 'completed').length
  const pending = userTasks.filter(task => getTaskStatus(task) === 'pending').length
  const inProgress = userTasks.filter(task => getTaskStatus(task) === 'in-progress').length
  const progress = userTasks.length ? Math.round((completed / userTasks.length) * 100) : 0

  const statusChart = [
    { label: 'Pendentes', value: pending },
    { label: 'Em andamento', value: inProgress },
    { label: 'Concluidas', value: completed },
  ]

  const categoryChart = CATEGORIES.map(category => ({
    label: category,
    value: userTasks.filter(task => (task.category || 'Geral') === category).length,
  })).filter(item => item.value > 0)

  const priorityChart = PRIORITIES.map(priority => ({
    label: priority.label,
    value: userTasks.filter(task => (task.priority ?? 'medium') === priority.value).length,
  })).filter(item => item.value > 0)

  return (
    <div className="charts-page">
      <section className="panel charts-hero">
        <div>
          <p className="eyebrow">Analise</p>
          <h2>Visao geral das tarefas</h2>
          <p className="muted">Acompanhe o volume de tarefas por status, categoria e prioridade.</p>
        </div>
        <div className="progress-ring large" style={{ ['--progress' as string]: `${progress}%` }}>
          <strong>{progress}%</strong>
          <span>concluido</span>
        </div>
      </section>

      <section className="analytics-grid">
        <div className="panel">
          <p className="eyebrow">Status</p>
          <h2>Andamento</h2>
          <ChartList items={statusChart} total={userTasks.length} />
        </div>

        <div className="panel">
          <p className="eyebrow">Categorias</p>
          <h2>Distribuicao</h2>
          <ChartList items={categoryChart} total={userTasks.length} />
        </div>

        <div className="panel">
          <p className="eyebrow">Prioridade</p>
          <h2>Urgencia</h2>
          <ChartList items={priorityChart} total={userTasks.length} />
        </div>
      </section>
    </div>
  )
}

function ChartList({ items, total }: { items: Array<{ label: string; value: number }>; total: number }) {
  if (!items.length) {
    return <p className="muted chart-empty">Sem dados para exibir.</p>
  }

  return (
    <div className="chart-list">
      {items.map(item => {
        const width = total ? Math.round((item.value / total) * 100) : 0
        return (
          <div className="chart-row" key={item.label}>
            <span>{item.label}</span>
            <div className="chart-track">
              <div className="chart-bar" style={{ width: `${width}%` }} />
            </div>
            <strong>{item.value}</strong>
          </div>
        )
      })}
    </div>
  )
}

function getTaskStatus(task: Task): TaskStatus {
  if (task.status) return task.status
  return task.completed ? 'completed' : 'pending'
}
