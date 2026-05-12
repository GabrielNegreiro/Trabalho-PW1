import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types'

interface AuthContextType {
  currentUser: User | null
  users: User[]
  login: (email: string, password: string) => boolean
  logout: () => void
  register: (username: string, email: string, password: string) => boolean
  updateUser: (updated: User) => void
  updateAnyUser: (updated: User) => void
  deleteUser: (userId: string) => void
}

const AuthContext = createContext<AuthContextType | null>(null)
const SESSION_COOKIE_NAME = 'taskflow_session'

const INITIAL_USERS: User[] = [
  {
    id: '1',
    username: 'Admin',
    email: 'admin.master@taskflow.com',
    password: '123456',
    avatar: '',
  },
]

interface UserSession {
  id: string
  email: string
}

function saveSessionCookie(user: User) {
  const session: UserSession = {
    id: user.id,
    email: user.email,
  }

  document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(session))}; path=/; max-age=604800; SameSite=Lax`
}

function getSessionCookie(): UserSession | null {
  const cookie = document.cookie
    .split('; ')
    .find(item => item.startsWith(`${SESSION_COOKIE_NAME}=`))

  if (!cookie) return null

  try {
    return JSON.parse(decodeURIComponent(cookie.split('=')[1])) as UserSession
  } catch {
    return null
  }
}

function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('taskflow_users')
    return saved ? JSON.parse(saved) : INITIAL_USERS
  })

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUsers = localStorage.getItem('taskflow_users')
    const storedUsers: User[] = savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS
    const session = getSessionCookie()

    if (!session) return null

    return storedUsers.find(user => user.id === session.id && user.email === session.email) ?? null
  })

  const login = (email: string, password: string): boolean => {
    const user = users.find(u => u.email === email && u.password === password)
    if (user) {
      setCurrentUser(user)
      saveSessionCookie(user)
      localStorage.removeItem('taskflow_current_user')
      return true
    }
    return false
  }

  const logout = () => {
    setCurrentUser(null)
    clearSessionCookie()
    localStorage.removeItem('taskflow_current_user')
  }

  const register = (username: string, email: string, password: string): boolean => {
    const exists = users.find(u => u.email === email)
    if (exists) return false

    const newUser: User = {
      id: crypto.randomUUID(),
      username,
      email,
      password,
      avatar: '',
    }

    const updated = [...users, newUser]
    setUsers(updated)
    localStorage.setItem('taskflow_users', JSON.stringify(updated))
    return true
  }

  const updateUser = (updated: User) => {
    const updatedUsers = users.map(u => u.id === updated.id ? updated : u)
    setUsers(updatedUsers)
    setCurrentUser(updated)
    localStorage.setItem('taskflow_users', JSON.stringify(updatedUsers))
    saveSessionCookie(updated)
    localStorage.removeItem('taskflow_current_user')
  }

  const updateAnyUser = (updated: User) => {
    const updatedUsers = users.map(u => u.id === updated.id ? updated : u)
    setUsers(updatedUsers)
    localStorage.setItem('taskflow_users', JSON.stringify(updatedUsers))

    if (currentUser?.id === updated.id) {
      setCurrentUser(updated)
      saveSessionCookie(updated)
    }
  }

  const deleteUser = (userId: string) => {
    if (userId === '1') return

    const updatedUsers = users.filter(user => user.id !== userId)
    setUsers(updatedUsers)
    localStorage.setItem('taskflow_users', JSON.stringify(updatedUsers))

    const savedTasks = localStorage.getItem('taskflow_tasks')
    if (savedTasks) {
      const tasks = JSON.parse(savedTasks) as Array<{ userId: string }>
      localStorage.setItem('taskflow_tasks', JSON.stringify(tasks.filter(task => task.userId !== userId)))
    }
  }

  return (
    <AuthContext.Provider value={{ currentUser, users, login, logout, register, updateUser, updateAnyUser, deleteUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro do AuthProvider')
  return context
}
