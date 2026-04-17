import type { H3Event } from 'h3'
import type { D1Database } from '@cloudflare/workers-types'

interface CloudflareBinding {
  DB?: D1Database
}

export const getDb = (event: H3Event): D1Database => {
  const db = event.context.cloudflare?.env && (event.context.cloudflare.env as CloudflareBinding).DB
  if (!db) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Database binding not configured'
    })
  }

  return db
}

export const nowIso = (): string => new Date().toISOString()

export const parseIdParam = (value: string | undefined, field = 'id'): number => {
  const parsed = Number.parseInt(value ?? '', 10)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createError({ statusCode: 400, statusMessage: `Invalid ${field}` })
  }

  return parsed
}
