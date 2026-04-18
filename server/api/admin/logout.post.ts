import { logoutAdmin } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await logoutAdmin(event)

  return {
    success: true
  }
})
