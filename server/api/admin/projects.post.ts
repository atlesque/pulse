import { requireAdmin } from '~~/server/utils/auth'
import { createApiToken } from '~~/server/utils/crypto'
import { getDb, nowIso } from '~~/server/utils/db'

interface CreateProjectBody {
  name?: string
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<CreateProjectBody | null>(event)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' })
  }

  if (Object.keys(body).length !== 1 || !Object.prototype.hasOwnProperty.call(body, 'name')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' })
  }

  if (typeof body.name !== 'string' || body.name.trim().length === 0 || body.name.trim().length > 120) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid project name' })
  }

  const name = body.name.trim()
  const db = getDb(event)
  const createdAt = nowIso()

  let projectInsert
  try {
    projectInsert = await db
      .prepare('INSERT INTO projects(name, created_at) VALUES(?, ?)')
      .bind(name, createdAt)
      .run()
  } catch {
    throw createError({ statusCode: 409, statusMessage: 'Project name already exists' })
  }

  const projectId = Number(projectInsert.meta.last_row_id)
  const project = await db
    .prepare('SELECT id, name FROM projects WHERE id = ? LIMIT 1')
    .bind(projectId)
    .first<{ id: number, name: string }>()

  if (!project) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create project' })
  }

  const tokenData = createApiToken()
  await db
    .prepare('INSERT INTO api_tokens(project_id, token_uid, token_hash, created_at) VALUES(?, ?, ?, ?)')
    .bind(project.id, tokenData.uid, await tokenData.hash, createdAt)
    .run()

  return {
    project,
    token: tokenData.token
  }
})
