import { loginAdmin } from '~~/server/utils/auth'

interface LoginBody {
  username?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<LoginBody | null>(event)

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' })
  }

  const keys = Object.keys(body)
  if (keys.length !== 2 || !keys.includes('username') || !keys.includes('password')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' })
  }

  if (typeof body.username !== 'string' || typeof body.password !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' })
  }

  await loginAdmin(event, body.username.trim(), body.password)

  return {
    authenticated: true
  }
})
