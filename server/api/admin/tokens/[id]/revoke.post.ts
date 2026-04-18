import { requireAdmin } from '~~/server/utils/auth'
import { getDb, nowIso, parseIdParam } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const tokenId = parseIdParam(getRouterParam(event, 'id'), 'token id')
  const db = getDb(event)

  const token = await db
    .prepare('SELECT id FROM api_tokens WHERE id = ? LIMIT 1')
    .bind(tokenId)
    .first<{ id: number }>()

  if (!token) {
    throw createError({ statusCode: 404, statusMessage: 'Token not found' })
  }

  await db
    .prepare('UPDATE api_tokens SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL')
    .bind(nowIso(), tokenId)
    .run()

  return {
    success: true
  }
})
