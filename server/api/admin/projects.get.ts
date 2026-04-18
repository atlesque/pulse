import { requireAdmin } from '~~/server/utils/auth'
import { getDb } from '~~/server/utils/db'
import type { AllowedStatus } from '~~/server/utils/constants'

interface ProjectRow {
  id: number
  name: string
  created_at: string
  latest_status: AllowedStatus | null
  latest_status_at: string | null
}

interface TokenRow {
  id: number
  project_id: number
  token_uid: string
  created_at: string
  revoked_at: string | null
}

interface EventRow {
  id: number
  project_id: number
  status: AllowedStatus
  created_at: string
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = getDb(event)

  const projectsResult = await db
    .prepare(`
      SELECT
        p.id,
        p.name,
        p.created_at,
        ls.status AS latest_status,
        ls.created_at AS latest_status_at
      FROM projects p
      LEFT JOIN (
        SELECT se.project_id, se.status, se.created_at
        FROM status_events se
        INNER JOIN (
          SELECT project_id, MAX(created_at) AS max_created_at
          FROM status_events
          GROUP BY project_id
        ) latest ON latest.project_id = se.project_id AND latest.max_created_at = se.created_at
      ) ls ON ls.project_id = p.id
      ORDER BY p.created_at DESC
    `)
    .all<ProjectRow>()

  const tokensResult = await db
    .prepare('SELECT id, project_id, token_uid, created_at, revoked_at FROM api_tokens ORDER BY created_at DESC')
    .all<TokenRow>()

  const eventsResult = await db
    .prepare('SELECT id, project_id, status, created_at FROM status_events ORDER BY created_at DESC')
    .all<EventRow>()

  const tokensByProject = new Map<number, TokenRow[]>()
  for (const token of tokensResult.results ?? []) {
    if (!tokensByProject.has(token.project_id)) {
      tokensByProject.set(token.project_id, [])
    }

    tokensByProject.get(token.project_id)?.push(token)
  }

  const eventsByProject = new Map<number, EventRow[]>()
  for (const statusEvent of eventsResult.results ?? []) {
    const current = eventsByProject.get(statusEvent.project_id) ?? []
    if (current.length < 10) {
      current.push(statusEvent)
      eventsByProject.set(statusEvent.project_id, current)
    }
  }

  return {
    projects: (projectsResult.results ?? []).map((project: ProjectRow) => ({
      id: project.id,
      name: project.name,
      latestStatus: project.latest_status,
      latestStatusAt: project.latest_status_at,
      tokens: (tokensByProject.get(project.id) ?? []).map(token => ({
        id: token.id,
        uid: token.token_uid,
        createdAt: token.created_at,
        revokedAt: token.revoked_at
      })),
      recentEvents: (eventsByProject.get(project.id) ?? []).map(statusEvent => ({
        id: statusEvent.id,
        status: statusEvent.status,
        timestamp: statusEvent.created_at
      }))
    }))
  }
})
