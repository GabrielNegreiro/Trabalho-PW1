export interface User {
  id: string
  username: string
  email: string
  password: string
  avatar?: string
}

export interface Task {
  id: string
  userId: string
  title: string
  completed: boolean
  dueDate?: string
  createdAt: string
}

export type AppView = 'login' | 'register' | 'forgot' | 'dashboard' | 'settings' | 'admin'

export type NavigateTo = (view: AppView) => void

export type ThemeSetter = (value: boolean | ((current: boolean) => boolean)) => void
