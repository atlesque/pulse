import { ALLOWED_STATUSES, type AllowedStatus } from '~~/server/utils/constants'
import { getDb, nowIso } from '~~/server/utils/db'
import { sha256Hex } from '~~/server/utils/crypto'

interface StatusBody {
  status?: string
}

const isAllowedStatus = (value: string): value is AllowedStatus => {
  return (ALLOWED_STATUSES as readonly string[]).includes(value)
}

const extractBearerToken = (authorizationHeader: string | undefined): string | null => {
  if (!authorizationHeader) {
    return null
  }

  const [scheme, value] = authorizationHeader.trim().split(/\s+/, 2)
  if (scheme !== 'Bearer' || !value) {
    return null
  }

  return value
}

export default defineEventHandler(async (event) => {
  const token = extractBearerToken(getHeader(event, 'authorization'))
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Missing or invalid token' })
  }

  const body = await readBody<StatusBody | null>(event)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' })
  }

  if (Object.keys(body).length !== 1 || !Object.prototype.hasOwnProperty.call(body, 'status')) {
    throw createError({ statusCode: 400, statusMessage: 'Body must contain only status' })
  }

  if (typeof body.status !== 'string' || !isAllowedStatus(body.status)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid status' })
  }

  const db = getDb(event)
  const tokenHash = await sha256Hex(token)

  const apiToken = await db
    .prepare('SELECT project_id FROM api_tokens WHERE token_hash = ? AND revoked_at IS NULL LIMIT 1')
    .bind(tokenHash)
    .first<{ project_id: number }>()

  if (!apiToken) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }

  await db
    .prepare('INSERT INTO status_events(project_id, status, created_at) VALUES(?, ?, ?)')
    .bind(apiToken.project_id, body.status, nowIso())
    .run()

  setResponseStatus(event, 202)
  return {
    accepted: true
  }
})
