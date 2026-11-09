import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  loginRequest,
  logoutRequest,
  refreshRequest,
  registerRequest,
  type RegisterInput,
  type TokenResponse,
  type UserProfile,
} from './api'

const STORAGE_KEY = 'skyword.session.v1'

export type Session = {
  accessToken: string
  refreshToken: string
  expiresAt: string
  user: UserProfile
}

type AuthContextValue = {
  user: UserProfile | null
  session: Session | null
  login: (email: string, password: string, remember: boolean) => Promise<UserProfile>
  register: (input: RegisterInput) => Promise<UserProfile>
  refresh: () => Promise<Session>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function parseSession(raw: string | null): Session | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<Session>
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.user?.email) return null
    return parsed as Session
  } catch {
    return null
  }
}

function loadSession(): Session | null {
  if (typeof window === 'undefined') return null
  return parseSession(sessionStorage.getItem(STORAGE_KEY)) ??
    parseSession(localStorage.getItem(STORAGE_KEY))
}

function saveSession(session: Session, remember: boolean): void {
  const raw = JSON.stringify(session)
  if (remember) {
    localStorage.setItem(STORAGE_KEY, raw)
    sessionStorage.removeItem(STORAGE_KEY)
  } else {
    sessionStorage.setItem(STORAGE_KEY, raw)
    localStorage.removeItem(STORAGE_KEY)
  }
}

function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(STORAGE_KEY)
}

function isPersistentSession(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) !== null
}

function toSession(response: TokenResponse): Session {
  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    expiresAt: response.accessTokenExpiresAtUtc,
    user: response.user,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession)
  const refreshPromiseRef = useRef<Promise<Session> | null>(null)

  const login = useCallback(
    async (email: string, password: string, remember: boolean) => {
      const response = await loginRequest(email.trim().toLowerCase(), password)
      const next = toSession(response)
      saveSession(next, remember)
      setSession(next)
      return next.user
    },
    [],
  )

  const register = useCallback(async (input: RegisterInput) => {
    const response = await registerRequest({
      ...input,
      email: input.email.trim().toLowerCase(),
      displayName: input.displayName.trim(),
    })

    // Đăng ký không tự đăng nhập: thu hồi token vừa phát để người dùng chủ động
    // đăng nhập lại bằng email đã đăng ký. Token vẫn tự hết hạn nếu thu hồi lỗi.
    try {
      await logoutRequest(response.accessToken, response.refreshToken)
    } catch {
      // Không chặn việc tạo tài khoản chỉ vì bước dọn token thất bại.
    }

    return response.user
  }, [])

  const refresh = useCallback(async () => {
    if (!session) {
      throw new Error('Không có phiên đăng nhập để làm mới.')
    }

    // Nhiều component có thể cùng gặp 401; chỉ gọi refresh một lần.
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current
    }

    const task = (async () => {
      const response = await refreshRequest(session.refreshToken)
      const next = toSession(response)
      saveSession(next, isPersistentSession())
      setSession(next)
      return next
    })()

    refreshPromiseRef.current = task
    try {
      return await task
    } finally {
      refreshPromiseRef.current = null
    }
  }, [session])

  const logout = useCallback(async () => {
    if (session) {
      try {
        await logoutRequest(session.accessToken, session.refreshToken)
      } catch {
        // Token có thể đã hết hạn; vẫn xóa phiên ở máy người dùng.
      }
    }
    clearSession()
    setSession(null)
  }, [session])

  const value = useMemo<AuthContextValue>(
    () => ({ user: session?.user ?? null, session, login, register, refresh, logout }),
    [session, login, register, refresh, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth phải được dùng bên trong AuthProvider.')
  }
  return context
}
