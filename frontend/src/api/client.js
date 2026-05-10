import axios from 'axios'

/**
 * In dev, avoid same-origin `/api/*` → Vite (proxy often yields POST 404 / resume failures).
 * Call FastAPI on :8000 directly (backend CORS already allows localhost:5173).
 */
function coerceDevBackendBase(trimmed) {
  if (!import.meta.env.DEV) return trimmed
  try {
    if (trimmed === '/api' || trimmed === 'api') {
      return 'http://localhost:8000'
    }
    if (trimmed.startsWith('/') && trimmed.startsWith('/api/')) {
      return 'http://localhost:8000'
    }
    if (/^https?:\/\//i.test(trimmed)) {
      const u = new URL(trimmed)
      const port = u.port || (u.protocol === 'https:' ? '443' : '80')
      const local =
        u.hostname === 'localhost' ||
        u.hostname === '127.0.0.1' ||
        u.hostname === '[::1]'
      if (local && port === '5173' && u.pathname.startsWith('/api')) {
        return 'http://localhost:8000'
      }
    }
  } catch {
    /* keep trimmed */
  }
  return trimmed
}

function resolveApiBaseURL() {
  const raw = import.meta.env.VITE_API_BASE_URL
  if (raw !== undefined && String(raw).trim() !== '') {
    const trimmed = String(raw).trim().replace(/\/$/, '')
    return coerceDevBackendBase(trimmed)
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:8000'
  }
  console.warn(
    '[PECDF] Set VITE_API_BASE_URL before build (e.g. https://your-api.onrender.com).'
  )
  return ''
}

/** Render free tier cold starts often exceed 45s; prod default allows first request to complete. */
function resolveTimeoutMs() {
  const raw = import.meta.env.VITE_API_TIMEOUT_MS
  const n = raw != null && String(raw).trim() !== '' ? Number(raw) : NaN
  if (Number.isFinite(n) && n > 0) return n
  return import.meta.env.PROD ? 120_000 : 45_000
}

const client = axios.create({
  baseURL: resolveApiBaseURL(),
  timeout: resolveTimeoutMs(),
  headers: { 'Content-Type': 'application/json' }
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('pecdf_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pecdf_token')
      localStorage.removeItem('pecdf_user')
      window.location.href = '/login'
    }
    const message = error.response?.data?.detail || error.message || 'Request failed'
    return Promise.reject(new Error(message))
  }
)

export default client
