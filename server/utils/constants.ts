export const ALLOWED_STATUSES = ['started', 'stopped', 'error'] as const

export type AllowedStatus = (typeof ALLOWED_STATUSES)[number]

export const ADMIN_SESSION_COOKIE = 'pulse_admin_session'
export const SESSION_TTL_MS = 1000 * 60 * 60 * 8
