import { requireAdmin } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event)
    return {
      authenticated: true,
      username: admin.username
    }
  } catch {
    return {
      authenticated: false
    }
  }
})
