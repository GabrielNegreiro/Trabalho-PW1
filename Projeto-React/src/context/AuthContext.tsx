import { createContext, useContext, useState } from 'react'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import {
  addSecurityEvent,
  clearLoginFailures,
  getSecurityEvents,
  isLoginBlocked,
  registerFailedLogin,
} from '../security'
import { parseUsers, serializeUsers } from '../secureStorage'
import type { LoginResult, SecurityEvent, User } from '../types'

interface AuthContextType {
  currentUser: User | null
  users: User[]
  securityEvents: SecurityEvent[]
  sessionStartedAt?: string
  login: (email: string, password: string) => LoginResult
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
    email: 'admin@sla.com',
    password: '123456',
    avatar: '',
  },
]

interface UserSession {
  id: string
  email: string
  startedAt: string
}

function saveSessionCookie(user: User) {
  const session: UserSession = {
    id: user.id,
    email: user.email,
    startedAt: new Date().toISOString(),
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
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>(() => getSecurityEvents())

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('taskflow_users')
    return parseUsers(saved, INITIAL_USERS)
  })

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUsers = localStorage.getItem('taskflow_users')
    const storedUsers = parseUsers(savedUsers, INITIAL_USERS)
    const session = getSessionCookie()

    if (!session) return null

    return storedUsers.find(user => user.id === session.id && user.email === session.email) ?? null
  })

  const [sessionStartedAt, setSessionStartedAt] = useState<string | undefined>(() => getSessionCookie()?.startedAt)

  useEffect(() => {
    localStorage.setItem('taskflow_users', serializeUsers(users))
  }, [users])

  const recordSecurityEvent = (type: Parameters<typeof addSecurityEvent>[0], email: string, message: string) => {
    setSecurityEvents(addSecurityEvent(type, email, message))
  }

  const login = (email: string, password: string): LoginResult => {
    const normalizedEmail = email.trim().toLowerCase()
    const blockedAttempt = isLoginBlocked(normalizedEmail)

    if (blockedAttempt?.blockedUntil) {
      recordSecurityEvent('login_blocked', normalizedEmail, 'Tentativa durante bloqueio temporario.')
      return {
        success: false,
        message: 'Muitas tentativas incorretas. Aguarde para tentar novamente.',
        blockedUntil: blockedAttempt.blockedUntil,
        failedAttempts: blockedAttempt.count,
      }
    }

    const user = users.find(u => u.email.toLowerCase() === normalizedEmail && u.password === password)
    if (user) {
      setCurrentUser(user)
      saveSessionCookie(user)
      setSessionStartedAt(getSessionCookie()?.startedAt)
      clearLoginFailures(normalizedEmail)
      recordSecurityEvent('login_success', normalizedEmail, 'Login realizado com sucesso.')
      localStorage.removeItem('taskflow_current_user')
      return { success: true }
    }

    const failedAttempt = registerFailedLogin(normalizedEmail)
    recordSecurityEvent('login_failed', normalizedEmail, `Senha incorreta. Tentativa ${failedAttempt.count} de 5.`)
    return {
      success: false,
      message: failedAttempt.blockedUntil
        ? 'Muitas tentativas incorretas. Login bloqueado por 30 segundos.'
        : 'E-mail ou senha incorretos.',
      blockedUntil: failedAttempt.blockedUntil,
      failedAttempts: failedAttempt.count,
    }
  }

  const logout = () => {
    if (currentUser) {
      recordSecurityEvent('logout', currentUser.email, 'Sessao encerrada.')
    }
    setCurrentUser(null)
    setSessionStartedAt(undefined)
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
      passwordUpdatedAt: new Date().toISOString(),
    }

    const updated = [...users, newUser]
    setUsers(updated)
    localStorage.setItem('taskflow_users', serializeUsers(updated))
    recordSecurityEvent('register', email, 'Nova conta cadastrada.')
    return true
  }

  const updateUser = (updated: User) => {
    const previousUser = users.find(user => user.id === updated.id)
    const passwordChanged = previousUser?.password !== updated.password
    const userToSave = passwordChanged ? { ...updated, passwordUpdatedAt: new Date().toISOString() } : updated
    const updatedUsers = users.map(u => u.id === userToSave.id ? userToSave : u)

    setUsers(updatedUsers)
    setCurrentUser(userToSave)
    localStorage.setItem('taskflow_users', serializeUsers(updatedUsers))
    saveSessionCookie(userToSave)
    setSessionStartedAt(getSessionCookie()?.startedAt)
    recordSecurityEvent(passwordChanged ? 'password_changed' : 'profile_updated', userToSave.email, passwordChanged ? 'Senha alterada.' : 'Perfil atualizado.')
    localStorage.removeItem('taskflow_current_user')
  }

  const updateAnyUser = (updated: User) => {
    const previousUser = users.find(user => user.id === updated.id)
    const passwordChanged = previousUser?.password !== updated.password
    const userToSave = passwordChanged ? { ...updated, passwordUpdatedAt: new Date().toISOString() } : updated
    const updatedUsers = users.map(u => u.id === userToSave.id ? userToSave : u)
    setUsers(updatedUsers)
    localStorage.setItem('taskflow_users', serializeUsers(updatedUsers))
    recordSecurityEvent(passwordChanged ? 'password_changed' : 'profile_updated', userToSave.email, passwordChanged ? 'Senha alterada pelo admin.' : 'Usuario atualizado pelo admin.')

    if (currentUser?.id === userToSave.id) {
      setCurrentUser(userToSave)
      saveSessionCookie(userToSave)
      setSessionStartedAt(getSessionCookie()?.startedAt)
    }
  }

  const deleteUser = (userId: string) => {
    if (userId === '1') return

    const updatedUsers = users.filter(user => user.id !== userId)
    setUsers(updatedUsers)
    localStorage.setItem('taskflow_users', serializeUsers(updatedUsers))
    const deletedUser = users.find(user => user.id === userId)
    if (deletedUser) recordSecurityEvent('user_deleted', deletedUser.email, 'Usuario deletado pelo admin.')

    const savedTasks = localStorage.getItem('taskflow_tasks')
    if (savedTasks) {
      const tasks = JSON.parse(savedTasks) as Array<{ userId: string }>
      localStorage.setItem('taskflow_tasks', JSON.stringify(tasks.filter(task => task.userId !== userId)))
    }
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        securityEvents,
        sessionStartedAt,
        login,
        logout,
        register,
        updateUser,
        updateAnyUser,
        deleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro do AuthProvider')
  return context
}
