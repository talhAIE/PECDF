import { useState, useCallback, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { sendChatMessage, getSessionHistory, clearSession } from '../api/agent'
import { useMacroStore } from '../store/macroStore'

const SESSION_KEY = 'pecdf_session_id'

export function useAgentChat() {
  const [messages, setMessages]     = useState([])
  const [sessionId, setSessionId]   = useState(() => localStorage.getItem(SESSION_KEY))
  const [isRestorable, setIsRestorable] = useState(() => !!localStorage.getItem(SESSION_KEY))
  const usd_pkr       = useMacroStore(s => s.usd_pkr)
  const brent_oil     = useMacroStore(s => s.brent_oil)
  const us_confidence = useMacroStore(s => s.us_confidence)
  const pendingRef = useRef(null)

  const { mutate, isPending } = useMutation({
    mutationFn: sendChatMessage,
    onSuccess: (data) => {
      const sid = data.session_id
      setSessionId(sid)
      localStorage.setItem(SESSION_KEY, sid)
      setMessages(prev => [
        ...prev,
        {
          id:         `${Date.now()}-assistant`,
          role:       'assistant',
          content:    data.response,
          tools_used: data.tools_used ?? [],
        },
      ])
    },
    onError: () => {
      setMessages(prev => [
        ...prev,
        {
          id:         `${Date.now()}-error`,
          role:       'assistant',
          content:    'Sorry, something went wrong. Please try again.',
          tools_used: [],
          isError:    true,
        },
      ])
    },
  })

  const send = useCallback((text) => {
    if (!text.trim()) return
    setMessages(prev => [
      ...prev,
      { id: `${Date.now()}-user`, role: 'user', content: text, tools_used: [] },
    ])
    mutate({ message: text, session_id: sessionId, macro: { usd_pkr, brent_oil, us_confidence } })
  }, [mutate, sessionId, usd_pkr, brent_oil, us_confidence])

  const restore = useCallback(async () => {
    const sid = localStorage.getItem(SESSION_KEY)
    if (!sid) return
    try {
      const data = await getSessionHistory(sid)
      const msgs = (data.messages ?? []).map(m => ({
        id:         m.id,
        role:       m.role,
        content:    m.content,
        tools_used: typeof m.tools_used === 'string'
          ? JSON.parse(m.tools_used)
          : (m.tools_used ?? []),
      }))
      setMessages(msgs)
      setSessionId(sid)
    } catch {
      localStorage.removeItem(SESSION_KEY)
      setSessionId(null)
    }
    setIsRestorable(false)
  }, [])

  const clear = useCallback(async () => {
    const sid = sessionId
    setMessages([])
    setSessionId(null)
    setIsRestorable(false)
    localStorage.removeItem(SESSION_KEY)
    if (sid) {
      try { await clearSession(sid) } catch { /* ignore */ }
    }
  }, [sessionId])

  const dismiss = useCallback(() => setIsRestorable(false), [])

  return { messages, isPending, isRestorable, sessionId, send, restore, clear, dismiss }
}
