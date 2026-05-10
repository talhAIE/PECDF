import { useEffect } from 'react'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { verifyToken } from '../../api/auth'

export default function AuthGuard() {
  const { token, setAuth, clearAuth, user } = useAuthStore()
  const navigate = useNavigate()

  // On mount, verify the stored token is still valid
  useEffect(() => {
    if (!token) return
    verifyToken()
      .then((data) => {
        // Refresh user info if we have it from the verify response
        if (data?.user_id && !user) {
          setAuth(token, { user_id: data.user_id, email: data.email })
        }
      })
      .catch(() => {
        clearAuth()
        navigate('/login', { replace: true })
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
