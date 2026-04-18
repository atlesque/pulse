export type StatusValue = 'started' | 'stopped' | 'error'

export interface ProjectToken {
  id: number
  uid: string
  createdAt: string
  revokedAt: string | null
}

export interface StatusEvent {
  id: number
  status: StatusValue
  timestamp: string
}

export interface ProjectSummary {
  id: number
  name: string
  latestStatus: StatusValue | null
  latestStatusAt: string | null
  tokens: ProjectToken[]
  recentEvents: StatusEvent[]
}

export interface AdminSessionResponse {
  authenticated: boolean
  username?: string
}

export interface LoginResponse {
  authenticated: boolean
}

export interface AdminProjectsResponse {
  projects: ProjectSummary[]
}

export interface TokenCreateResponse {
  project: {
    id: number
    name: string
  }
  token: string
}
