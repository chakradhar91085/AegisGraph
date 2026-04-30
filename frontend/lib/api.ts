import { getIdToken } from './firebaseAuth'

const BASE = 'http://localhost:8000'

/** Core fetch helper — automatically injects Firebase ID token */
async function api(path: string, options?: RequestInit) {
  const token = await getIdToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> || {}),
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const Query = {
  run: (raw_query: string, user_id: string, role: string) =>
    api('/query', { method: 'POST', body: JSON.stringify({ raw_query, user_id, role }) }),
}

export const Logs = {
  get: (user_id: string) => api(`/logs/${user_id}`),
}

export const Profile = {
  get: (user_id: string) => api(`/profile/${user_id}`),
}

export const Graph = {
  topology: () => api('/graph/topology'),
}
