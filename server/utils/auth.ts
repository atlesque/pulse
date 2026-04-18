import type { H3Event } from 'h3'
import { getCookie, setCookie, deleteCookie } from 'h3'
import { ADMIN_SESSION_COOKIE, SESSION_TTL_MS } from './constants'
import { createSecret, hashPassword, sha256Hex } from './crypto'
import { getDb, nowIso } from './db'

interface AdminRecord {
  id: number
  username: string
  password_salt: string
  password_hash: string
  session_token_hash: string | null
  session_expires_at: string | null
  is_active: number
}

const createSessionCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: false,
  maxAge: SESSION_TTL_MS / 1000
})

export const requireAdmin = async (event: H3Event): Promise<{ id: number, username: string }> => {
  const sessionToken = getCookie(event, ADMIN_SESSION_COOKIE)
  if (!sessionToken) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const db = getDb(event)
  const sessionHash = await sha256Hex(sessionToken)
  const now = nowIso()

  const result = await db
    .prepare('SELECT id, username, session_expires_at FROM admins WHERE session_token_hash = ? AND is_active = 1')
    .bind(sessionHash)
    .first<{ id: number, username: string, session_expires_at: string | null }>()

  if (!result || !result.session_expires_at || result.session_expires_at <= now) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return {
    id: result.id,
    username: result.username
  }
}

export const loginAdmin = async (event: H3Event, username: string, password: string): Promise<void> => {
  const db = getDb(event)

  const admin = await db
    .prepare('SELECT id, username, password_salt, password_hash, is_active FROM admins WHERE username = ? LIMIT 1')
    .bind(username)
    .first<AdminRecord>()

  if (!admin || admin.is_active !== 1) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const passwordHash = await hashPassword(password, admin.password_salt)
  if (passwordHash !== admin.password_hash) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const sessionToken = createSecret(32)
  const sessionHash = await sha256Hex(sessionToken)
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()

  await db
    .prepare('UPDATE admins SET session_token_hash = ?, session_expires_at = ? WHERE id = ?')
    .bind(sessionHash, expiresAt, admin.id)
    .run()

  setCookie(event, ADMIN_SESSION_COOKIE, sessionToken, createSessionCookieOptions())
}

export const logoutAdmin = async (event: H3Event): Promise<void> => {
  const sessionToken = getCookie(event, ADMIN_SESSION_COOKIE)
  if (sessionToken) {
    const db = getDb(event)
    const sessionHash = await sha256Hex(sessionToken)

    await db
      .prepare('UPDATE admins SET session_token_hash = NULL, session_expires_at = NULL WHERE session_token_hash = ?')
      .bind(sessionHash)
      .run()
  }

  deleteCookie(event, ADMIN_SESSION_COOKIE, {
    path: '/'
  })
}
