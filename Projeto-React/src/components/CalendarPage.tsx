import { useMemo, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { Task, TaskStatus, User } from '../types'

interface CalendarPageProps {
  user: User
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

export function CalendarPage({ user }: CalendarPageProps) {
  const [tasks] = useLocalStorage<Task[]>('taskflow_tasks', [])
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()))
  const userTasks = useMemo(() => tasks.filter(task => task.userId === user.id), [tasks, user.id])
  const monthDays = useMemo(() => buildMonth(visibleMonth), [visibleMonth])
  const taskMonths = useMemo(() => getMonthsWithTasks(userTasks), [userTasks])
  const monthKey = getMonthKey(visibleMonth)
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(visibleMonth)

  const goToPreviousMonth = () => setVisibleMonth(current => addMonths(current, -1))
  const goToNextMonth = () => setVisibleMonth(current => addMonths(current, 1))
  const goToCurrentMonth = () => setVisibleMonth(startOfMonth(new Date()))
  const goToTaskMonth = (nextMonth: string) => {
    if (!nextMonth) return
    const [year, month] = nextMonth.split('-').map(Number)
    setVisibleMonth(new Date(year, month - 1, 1))
  }

  return (
    <section className="panel calendar-page">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Agenda</p>
          <h2>{capitalize(monthLabel)}</h2>
        </div>
        <div className="calendar-actions">
          <button type="button" onClick={goToPreviousMonth}>
            Anterior
          </button>
          <button type="button" onClick={goToCurrentMonth}>
            Hoje
          </button>
          <button type="button" onClick={goToNextMonth}>
            Proximo
          </button>
        </div>
      </div>

      <div className="calendar-jump">
        <span className="counter">{userTasks.filter(task => task.dueDate).length} com prazo</span>
        <select value={taskMonths.some(item => item.value === monthKey) ? monthKey : ''} onChange={event => goToTaskMonth(event.target.value)}>
          <option value="">Ir para mes com tarefa</option>
          {taskMonths.map(item => (
            <option key={item.value} value={item.value}>
              {item.label} ({item.count})
            </option>
          ))}
        </select>
      </div>

      <div className="month-calendar">
        {WEEK_DAYS.map(day => (
          <strong className="calendar-weekday" key={day}>
            {day}
          </strong>
        ))}

        {monthDays.map(day => {
          const dayTasks = userTasks.filter(task => task.dueDate === day.isoDate)

          return (
            <article className={day.isCurrentMonth ? 'month-day' : 'month-day muted-day'} key={day.isoDate}>
              <div className="month-day-number">{day.date.getDate()}</div>
              <div className="month-day-tasks">
                {dayTasks.length === 0 && <span>Sem tarefas</span>}
                {dayTasks.map(task => (
                  <div className={`calendar-task priority-${task.priority ?? 'medium'}`} key={task.id}>
                    <strong>{task.title}</strong>
                    <small>{getStatusLabel(task.status, task.completed)}</small>
                  </div>
                ))}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function buildMonth(monthDate: Date) {
  const month = monthDate.getMonth()
  const firstDay = startOfMonth(monthDate)
  const start = new Date(firstDay)
  start.setDate(firstDay.getDate() - firstDay.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return {
      date,
      isoDate: toInputDate(date),
      isCurrentMonth: date.getMonth() === month,
    }
  })
}

function getMonthsWithTasks(tasks: Task[]) {
  const months = tasks.reduce<Record<string, number>>((accumulator, task) => {
    if (!task.dueDate) return accumulator
    const month = task.dueDate.slice(0, 7)
    accumulator[month] = (accumulator[month] ?? 0) + 1
    return accumulator
  }, {})

  return Object.entries(months)
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([value, count]) => {
      const [year, month] = value.split('-').map(Number)
      const date = new Date(year, month - 1, 1)
      const label = capitalize(new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date))
      return { value, label, count }
    })
}

function getStatusLabel(status: TaskStatus | undefined, completed: boolean) {
  if (status === 'in-progress') return 'Em andamento'
  if (status === 'completed' || completed) return 'Concluida'
  return 'Pendente'
}

function toInputDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function getMonthKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}`
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
