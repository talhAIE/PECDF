import client from './client'

export const sendChatMessage = ({ message, session_id = null, macro }) =>
  client.post('/agent/chat', { message, session_id, macro })

export const getSessionHistory = (session_id) =>
  client.get(`/agent/sessions/${session_id}`)

export const clearSession = (session_id) =>
  client.delete(`/agent/sessions/${session_id}`)

export const generateReport = ({ scope, hs_code = null, horizon, tone, macro, session_id = null }) =>
  client.post('/agent/report', { scope, hs_code, horizon, tone, macro, session_id })
