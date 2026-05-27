export interface User {
  id: string
  username: string
  email: string
  password: string
  avatar?: string
  passwordUpdatedAt?: string
}

export type LoginResult = {
  success: boolean
  message?: string
  blockedUntil?: number
  failedAttempts?: number
}

export type PasswordStrengthLevel = 'weak' | 'medium' | 'strong'

export interface PasswordStrength {
  level: PasswordStrengthLevel
  score: number
  label: string
  tips: string[]
}

export type SecurityEventType =
  | 'login_success'
  | 'login_failed'
  | 'login_blocked'
  | 'logout'
  | 'register'
  | 'password_changed'
  | 'profile_updated'
  | 'user_deleted'

export interface SecurityEvent {
  id: string
  type: SecurityEventType
  email: string
  message: string
  createdAt: string
}

export type TaskStatus = 'pending' | 'in-progress' | 'completed'

export type TaskPriority = 'low' | 'medium' | 'high'

export interface Subtask {
  id: string
  title: string
  completed: boolean
}

export interface Task {
  id: string
  userId: string
  title: string
  completed: boolean
  status?: TaskStatus
  priority?: TaskPriority
  category?: string
  description?: string
  subtasks?: Subtask[]
  dueDate?: string
  createdAt: string
}

export type AppView = 'login' | 'register' | 'forgot' | 'dashboard' | 'calendar' | 'charts' | 'settings' | 'admin'

export type NavigateTo = (view: AppView) => void

export type ThemeSetter = (value: boolean | ((current: boolean) => boolean)) => void
