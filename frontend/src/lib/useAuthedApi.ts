import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from './api'
import { useAuth } from './AuthContext'

export function useAuthedApi() {
  const navigate = useNavigate()
  const { session, refresh, logout, user } = useAuth()

  const run = useCallback(
    async <T,>(task: (token: string) => Promise<T>): Promise<T> => {
      if (!session?.accessToken) {
        throw new ApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401)
      }

      try {
        return await task(session.accessToken)
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 401) {
          try {
            const next = await refresh()
            return await task(next.accessToken)
          } catch {
            await logout()
            navigate('/login', { replace: true, state: { email: user?.email } })
            throw new ApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401)
          }
        }
        throw caught
      }
    },
    [session, refresh, logout, navigate, user?.email],
  )

  return { run, session, user }
}
