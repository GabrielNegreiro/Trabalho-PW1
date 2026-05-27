import type { PasswordStrength, SecurityEvent, SecurityEventType } from './types'
import { parseSecurityEvents, serializeSecurityEvents } from './secureStorage'

const SECURITY_EVENTS_KEY = 'taskflow_security_events'
const LOGIN_ATTEMPTS_KEY = 'taskflow_login_attempts'
const MAX_EVENTS = 80
const MAX_FAILED_ATTEMPTS = 5
const BLOCK_TIME_MS = 30_000

interface LoginAttempt {
  email: string
  count: number
  lastAttemptAt: string
  blockedUntil?: number
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const checks = [
    { valid: password.length >= 8, tip: 'Use pelo menos 8 caracteres.' },
    { valid: /[a-z]/.test(password), tip: 'Inclua letra minuscula.' },
    { valid: /[A-Z]/.test(password), tip: 'Inclua letra maiuscula.' },
    { valid: /\d/.test(password), tip: 'Inclua numero.' },
    { valid: /[^A-Za-z0-9]/.test(password), tip: 'Inclua simbolo.' },
  ]
  const score = checks.filter(check => check.valid).length
  const tips = checks.filter(check => !check.valid).map(check => check.tip)

  if (score >= 4) return { level: 'strong', score, label: 'Senha forte', tips }
  if (score >= 3) return { level: 'medium', score, label: 'Senha media', tips }
  return { level: 'weak', score, label: 'Senha fraca', tips }
}

export function getSecurityEvents(): SecurityEvent[] {
  return parseSecurityEvents(localStorage.getItem(SECURITY_EVENTS_KEY))
}

export function addSecurityEvent(type: SecurityEventType, email: string, message: string) {
  const event: SecurityEvent = {
    id: crypto.randomUUID(),
    type,
    email: email || 'desconhecido',
    message,
    createdAt: new Date().toISOString(),
  }
  const events = [event, ...getSecurityEvents()].slice(0, MAX_EVENTS)
  localStorage.setItem(SECURITY_EVENTS_KEY, serializeSecurityEvents(events))
  return events
}

export function getLoginAttempt(email: string) {
  const attempts = getLoginAttempts()
  return attempts[normalizeEmail(email)] ?? null
}

export function isLoginBlocked(email: string) {
  const attempt = getLoginAttempt(email)
  if (!attempt?.blockedUntil) return null
  if (attempt.blockedUntil <= Date.now()) {
    clearLoginFailures(email)
    return null
  }
  return attempt
}

export function registerFailedLogin(email: string) {
  const normalizedEmail = normalizeEmail(email)
  const attempts = getLoginAttempts()
  const current = attempts[normalizedEmail]
  const nextCount = (current?.count ?? 0) + 1
  const blockedUntil = nextCount >= MAX_FAILED_ATTEMPTS ? Date.now() + BLOCK_TIME_MS : undefined

  const nextAttempt: LoginAttempt = {
    email: normalizedEmail,
    count: nextCount,
    lastAttemptAt: new Date().toISOString(),
    blockedUntil,
  }

  attempts[normalizedEmail] = nextAttempt
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts))
  return nextAttempt
}

export function clearLoginFailures(email: string) {
  const normalizedEmail = normalizeEmail(email)
  const attempts = getLoginAttempts()
  delete attempts[normalizedEmail]
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts))
}

export function formatSecurityEventType(type: SecurityEventType) {
  const labels: Record<SecurityEventType, string> = {
    login_success: 'Login realizado',
    login_failed: 'Login falhou',
    login_blocked: 'Login bloqueado',
    logout: 'Logout',
    register: 'Cadastro',
    password_changed: 'Senha alterada',
    profile_updated: 'Perfil atualizado',
    user_deleted: 'Usuario deletado',
  }
  return labels[type]
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatDurationFrom(value?: string) {
  if (!value) return 'Sessao nao identificada'
  const diff = Math.max(0, Date.now() - new Date(value).getTime())
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) return `${hours}h ${minutes % 60}min`
  return `${minutes}min`
}

function getLoginAttempts() {
  return readJson<Record<string, LoginAttempt>>(LOGIN_ATTEMPTS_KEY, {})
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) as T : fallback
  } catch {
    return fallback
  }
}
