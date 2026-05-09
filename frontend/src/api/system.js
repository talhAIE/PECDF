import client from './client'

export const fetchHealth = () => client.get('/health')

export const fetchLiveMacro = () => client.get('/macro/live')
