import { requireAdmin } from '~~/server/utils/auth'
import { createApiToken } from '~~/server/utils/crypto'
import { getDb, nowIso, parseIdParam } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const projectId = parseIdParam(getRouterParam(event, 'id'), 'project id')
  const db = getDb(event)

  const project = await db
    .prepare('SELECT id, name FROM projects WHERE id = ? LIMIT 1')
    .bind(projectId)
    .first<{ id: number, name: string }>()

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  const currentTimestamp = nowIso()
  await db
    .prepare('UPDATE api_tokens SET revoked_at = ? WHERE project_id = ? AND revoked_at IS NULL')
    .bind(currentTimestamp, project.id)
    .run()

  const tokenData = createApiToken()
  await db
    .prepare('INSERT INTO api_tokens(project_id, token_uid, token_hash, created_at) VALUES(?, ?, ?, ?)')
    .bind(project.id, tokenData.uid, await tokenData.hash, currentTimestamp)
    .run()

  return {
    project,
    token: tokenData.token
  }
})
