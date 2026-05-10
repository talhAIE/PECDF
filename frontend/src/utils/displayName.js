/** Title-case ASCII word for greetings */
function capWord(word) {
  const w = String(word || '').trim()
  if (!w) return ''
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
}

/**
 * Preferred first-name / short name for "Welcome …" heroes.
 * Prefers registration full name → then splits email local-part sensibly → strips stray digits when needed.
 * @param {{ email?: string, full_name?: string | null } | null | undefined} user
 */
export function welcomeFirstName(user) {
  if (!user) return null

  const full = String(user.full_name || '').trim()
  if (full) {
    const first = full.split(/\s+/).find(Boolean)
    if (first) return capWord(first)
  }

  const local = String(user.email || '').split('@')[0] || ''
  if (!local) return null

  if (/[._+-]/.test(local)) {
    const parts = local
      .split(/[._+-]+/)
      .map((s) => s.replace(/\d+/g, ''))
      .filter((s) => /^[a-zA-Z]{2,}$/.test(s))
    if (parts.length >= 2) return `${capWord(parts[0])} ${capWord(parts[1])}`
    if (parts.length === 1) return capWord(parts[0])
  }

  const alphaChunks = local
    .split(/\d+|[^a-zA-Z]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && /^[a-zA-Z]+$/.test(s))

  if (alphaChunks.length >= 2) {
    return `${capWord(alphaChunks[0])} ${capWord(alphaChunks[1])}`
  }
  if (alphaChunks.length === 1) {
    const w = alphaChunks[0]
    if (w.length <= 12) return capWord(w)
    return capWord(w.slice(0, 10))
  }

  return null
}
