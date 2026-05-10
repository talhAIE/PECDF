/** Normalize FastAPI / axios failures into human-readable strings. */

export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number | null, code?: string | null }} [opts]
   */
  constructor(message, opts = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = opts.status ?? null
    this.code = opts.code ?? null
  }
}

/** @typedef {{ detail?: unknown }} FastApiPayload */

/**
 * Flatten FastAPI `detail`: string | list[{loc,msg}] | other
 * @param {unknown} payload
 */
export function formatFastApiDetail(payload) {
  if (!payload || typeof payload !== 'object') return null
  const d = /** @type {FastApiPayload} */ (payload).detail
  if (d == null) return null
  if (typeof d === 'string') return d
  if (typeof d === 'number' || typeof d === 'boolean') return String(d)
  if (Array.isArray(d)) {
    const parts = d.map((item) => {
      if (typeof item === 'string') return item
      if (!item || typeof item !== 'object') return String(item)
      const loc = Array.isArray(item.loc)
        ? item.loc
            .filter((x) => x !== 'body' && x !== 'query' && x !== 'path')
            .map(String)
            .join('.')
        : ''
      const msg =
        typeof item.msg === 'string'
          ? item.msg
          : typeof item.message === 'string'
            ? item.message
            : null
      if (msg && loc) return `${loc}: ${msg}`
      if (msg) return msg
      return JSON.stringify(item)
    })
    return parts.filter(Boolean).join(' ')
  }
  if (typeof d === 'object' && typeof d.msg === 'string') return d.msg
  try {
    return JSON.stringify(d)
  } catch {
    return null
  }
}

const STATUS_FALLBACK = {
  400: 'The request could not be processed.',
  401: 'Sign in required or invalid credentials.',
  403: 'You do not have permission for this action.',
  404: 'The requested resource was not found.',
  409: 'This conflicts with existing data.',
  422: 'Some fields are invalid. Check your inputs.',
  429: 'Too many requests. Please wait and try again.',
  502: 'Bad gateway — the API may still be starting. Try again in a minute.',
  503: 'The service is temporarily unavailable.',
  504: 'Gateway timeout — try again shortly.'
}

/**
 * @param {number | null | undefined} status
 */
export function statusFallbackMessage(status) {
  if (status == null) return 'Request failed.'
  return STATUS_FALLBACK[status] ?? `Something went wrong (HTTP ${status}).`
}

/**
 * @param {{ response?: import('axios').AxiosResponse, request?: unknown, message?: string, code?: string } | null | undefined} error
 */
export function messageFromAxios(error) {
  if (!error) return 'Unknown error.'
  if (typeof error.response === 'object' && error.response) {
    const formatted = formatFastApiDetail(error.response.data)
    if (formatted) return formatted
    const status = error.response.status
    if (status != null) return statusFallbackMessage(status)
  }
  const code = error.code
  if (code === 'ECONNABORTED') {
    return 'Request timed out. If the API was asleep, wait a minute and try again.'
  }
  if (code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return 'Network error — check your connection or API URL (VITE_API_BASE_URL).'
  }
  if (!error.response && error.request) {
    return 'No response from the server — check whether the API is running and reachable.'
  }
  if (typeof error.message === 'string' && error.message.trim()) {
    return error.message
  }
  return 'Request failed.'
}

/**
 * @param {unknown} err
 * @param {string} [fallback]
 */
export function getErrorMessage(err, fallback = 'Something went wrong.') {
  if (err == null) return fallback
  if (typeof err === 'string') return err.trim() ? err : fallback
  if (err instanceof ApiError || (typeof err === 'object' && err !== null && 'message' in err)) {
    const m = /** @type {{ message?: string }} */ (err).message
    if (typeof m === 'string' && m.trim()) return m
  }
  try {
    return messageFromAxios(/** @type {Parameters<typeof messageFromAxios>[0]} */ (err)) || fallback
  } catch {
    return fallback
  }
}
