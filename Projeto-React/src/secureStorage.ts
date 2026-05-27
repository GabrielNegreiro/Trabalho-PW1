import type { SecurityEvent, User } from './types'

const ENCRYPTION_PREFIX = 'tfenc:'
const STORAGE_SECRET = 'taskflow-local-security-key'

type StoredUser = Omit<User, 'username' | 'email' | 'password' | 'avatar'> & {
  username: string
  email: string
  password: string
  avatar?: string
}

type StoredSecurityEvent = Omit<SecurityEvent, 'email'> & {
  email: string
}

export function encryptValue(value = '') {
  if (!value) return ''
  const encoded = encodeURIComponent(value)
  const encrypted = Array.from(encoded)
    .map((char, index) => String.fromCharCode(char.charCodeAt(0) ^ STORAGE_SECRET.charCodeAt(index % STORAGE_SECRET.length)))
    .join('')

  return `${ENCRYPTION_PREFIX}${btoa(encrypted)}`
}

export function decryptValue(value = '') {
  if (!value || !value.startsWith(ENCRYPTION_PREFIX)) return value

  try {
    const encrypted = atob(value.slice(ENCRYPTION_PREFIX.length))
    const decoded = Array.from(encrypted)
      .map((char, index) => String.fromCharCode(char.charCodeAt(0) ^ STORAGE_SECRET.charCodeAt(index % STORAGE_SECRET.length)))
      .join('')

    return decodeURIComponent(decoded)
  } catch {
    return ''
  }
}

export function encryptUser(user: User): StoredUser {
  return {
    ...user,
    username: encryptValue(user.username),
    email: encryptValue(user.email),
    password: encryptValue(user.password),
    avatar: encryptValue(user.avatar ?? ''),
  }
}

export function decryptUser(user: StoredUser): User {
  return {
    ...user,
    username: decryptValue(user.username),
    email: decryptValue(user.email),
    password: decryptValue(user.password),
    avatar: decryptValue(user.avatar ?? ''),
  }
}

export function serializeUsers(users: User[]) {
  return JSON.stringify(users.map(encryptUser))
}

export function parseUsers(value: string | null, fallback: User[]) {
  if (!value) return fallback

  try {
    const users = JSON.parse(value) as StoredUser[]
    return users.map(decryptUser)
  } catch {
    return fallback
  }
}

export function encryptSecurityEvent(event: SecurityEvent): StoredSecurityEvent {
  return {
    ...event,
    email: encryptValue(event.email),
  }
}

export function decryptSecurityEvent(event: StoredSecurityEvent): SecurityEvent {
  return {
    ...event,
    email: decryptValue(event.email),
  }
}

export function serializeSecurityEvents(events: SecurityEvent[]) {
  return JSON.stringify(events.map(encryptSecurityEvent))
}

export function parseSecurityEvents(value: string | null) {
  if (!value) return []

  try {
    const events = JSON.parse(value) as StoredSecurityEvent[]
    return events.map(decryptSecurityEvent)
  } catch {
    return []
  }
}
