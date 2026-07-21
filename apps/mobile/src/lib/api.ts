import { API_BASE_URL } from './config'
import { getToken } from './auth-storage'

// Shape returned by the backend's auth serialization (see server/routes/auth.js).
export type User = {
  id: string
  email: string
  name: string
  photoUrl: string
  isAdmin: boolean
}

export type AuthResponse = { token: string; user: User }

// serializeTrip in server/routes/trips.js (fields the mobile app consumes).
export type TripMember = {
  user: { id: string; name: string; email?: string; photoUrl?: string }
  role: 'admin' | 'member'
}

export type Trip = {
  id: string
  name: string
  destination: string
  startDate: string
  endDate: string
  dailyBudget: number
  homeCurrency: string
  tripType: 'shared' | 'family'
  travelType: 'family' | 'couple' | 'solo' | 'friends'
  createdBy: string
  createdByName?: string
  endedAt: string | null
  published: boolean
  members: TripMember[]
}

// attachCardData in server/routes/trips.js (discover feed cards).
export type FeedCard = {
  id: string
  name: string
  destination: string
  travelType: Trip['travelType']
  days: number
  dailyBudget: number
  homeCurrency: string
  coverPhotoUrl: string | null
  likesCount: number
  likedByMe: boolean
  favoritedByMe: boolean
  publishedAt: string
}

export type FeedResponse = { cards: FeedCard[]; hasMore: boolean }

// GET /trips/:id/public — the full read-only itinerary (see server/routes/trips.js).
export type PublicPlace = {
  id: string
  name: string
  address: string
  lat: number | null
  lng: number | null
  addedByName: string
}

export type PublicPhoto = {
  id: string
  url: string
  note: string
  addedByName: string
}

export type PublicDay = {
  day: string // date key, e.g. "2026-09-01"
  note: string
  places: PublicPlace[]
  photos: PublicPhoto[]
}

export type PublicTrip = {
  id: string
  name: string
  startDate: string
  endDate: string
  destination: string
  homeCurrency: string
  travelType: Trip['travelType']
  createdBy: string
  createdByName: string | null
  published: boolean
  publishedAt: string | null
  likesCount: number
  likedByMe: boolean
  favoritedByMe: boolean
  stats: {
    days: number
    travelers: number
    photos: number
    places: number
    spendYen: number
    spendHome: number
  }
  days: PublicDay[]
}

type RequestOptions = {
  method?: string
  body?: unknown
  auth?: boolean
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (auth) {
    const token = await getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`)
  }
  return data as T
}

// Mirrors client/src/api.js, typed and pointed at an absolute base URL.
export const api = {
  health: () => request<{ ok: boolean; db: string }>('/health', { auth: false }),
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  signup: (name: string, email: string, password: string) =>
    request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: { name, email, password },
      auth: false,
    }),
  me: () => request<User>('/auth/me'),
  listTrips: () => request<Trip[]>('/trips'),
  // Full itinerary; works for published trips and the viewer's own private trips.
  getItinerary: (id: string) => request<PublicTrip>(`/trips/${id}/itinerary`),
  getFeed: (params: { limit?: number; offset?: number } = {}) => {
    const qs = new URLSearchParams()
    if (params.limit != null) qs.set('limit', String(params.limit))
    if (params.offset != null) qs.set('offset', String(params.offset))
    const s = qs.toString()
    return request<FeedResponse>(`/trips/feed${s ? `?${s}` : ''}`)
  },
}
