const encoder = new TextEncoder()

const toHex = (buffer: ArrayBuffer): string => {
  return Array.from(new Uint8Array(buffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

export const sha256Hex = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return toHex(digest)
}

export const hashPassword = async (password: string, salt: string): Promise<string> => {
  return await sha256Hex(`${password}:${salt}`)
}

export const createSecret = (bytes = 32): string => {
  const data = new Uint8Array(bytes)
  crypto.getRandomValues(data)
  return Array.from(data)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

export const createApiToken = (): { uid: string, token: string, hash: Promise<string> } => {
  const uid = createSecret(8)
  const secret = createSecret(24)
  const token = `pulse_${uid}_${secret}`

  return {
    uid,
    token,
    hash: sha256Hex(token)
  }
}
