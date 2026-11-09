const API_BASE = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:5041'
).replace(/\/+$/, '')

export type UserProfile = {
  id: number
  email: string
  displayName: string
  avatarUrl: string | null
  currentLevelId: number | null
  levelCode: string | null
  levelName: string | null
  dailyWordGoal: number
  timeZoneId: string
  createdAt: string
}

export type TokenResponse = {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAtUtc: string
  user: UserProfile
}

export type Dashboard = {
  user: UserProfile
  streakDays: number
  today: {
    wordsLearned: number
    wordsReviewed: number
    minutesStudied: number
    dailyGoal: number
    goalMet: boolean
  }
  dueCount: number
  totalWords: number
  masteredWords: number
}

export type RegisterInput = {
  displayName: string
  email: string
  password: string
  currentLevelId: number | null
  dailyWordGoal: number
}

type ProblemPayload = {
  title?: string
  detail?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function messageFrom(payload: ProblemPayload | null, status: number): string {
  if (payload?.errors) {
    const first = Object.values(payload.errors).flat().find(Boolean)
    if (first) return first
  }
  if (payload?.detail && payload.detail.trim().length > 0) return payload.detail
  if (status === 401) return 'Email hoặc mật khẩu chưa đúng. Bạn thử lại nhé.'
  if (status === 409) return 'Email này đã được sử dụng.'
  if (status >= 500) return 'Máy chủ đang bận. Vui lòng thử lại sau ít phút.'
  return 'Yêu cầu chưa thể xử lý. Vui lòng thử lại.'
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json; charset=utf-8' } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new ApiError(
      'Không kết nối được máy chủ SkyWord. Kiểm tra API đang chạy ở cổng 5041 nhé.',
      0,
    )
  }

  const text = await response.text()
  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    throw new ApiError(messageFrom(payload as ProblemPayload | null, response.status), response.status)
  }

  return payload as T
}

export function loginRequest(email: string, password: string): Promise<TokenResponse> {
  return request<TokenResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function registerRequest(input: RegisterInput): Promise<TokenResponse> {
  return request<TokenResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      displayName: input.displayName,
      currentLevelId: input.currentLevelId,
      dailyWordGoal: input.dailyWordGoal,
    }),
  })
}

export function refreshRequest(refreshToken: string): Promise<TokenResponse> {
  return request<TokenResponse>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })
}

export function logoutRequest(accessToken: string, refreshToken: string): Promise<void> {
  return request<void>('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function dashboardRequest(accessToken: string): Promise<Dashboard> {
  return request<Dashboard>('/api/users/me/dashboard', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}
