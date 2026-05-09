import client from './client'

export const login = (email, password) =>
  client.post('/auth/login', { email, password })

export const register = (email, password, fullName) =>
  client.post('/auth/register', { email, password, full_name: fullName })

export const getMe = () =>
  client.get('/auth/me')

export const verifyToken = () =>
  client.get('/auth/verify')
