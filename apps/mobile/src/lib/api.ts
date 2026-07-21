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

export type ExpenseCategory = 'food' | 'transport' | 'fun' | 'shopping' | 'other'

export type PublicExpense = {
  id: string
  name: string
  category: ExpenseCategory
  amountYen: number
  amountHome: number
  addedByName: string
}

export type PublicDay = {
  day: string // date key, e.g. "2026-09-01"
  note: string
  places: PublicPlace[]
  expenses: PublicExpense[]
  photos: PublicPhoto[]
}

export type PublicTrip = {
  id: string
  name: string
  startDate: string
  endDate: string
  destination: string
  homeCurrency: string
  dailyBudget: number
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
  createTrip: (input: {
    name: string
    destination?: string
    startDate: string
    endDate: string
    dailyBudget: number
    homeCurrency: string
    tripType: 'shared' | 'family'
    travelType: Trip['travelType']
  }) => request<Trip>('/trips', { method: 'POST', body: input }),
  // Full itinerary; works for published trips and the viewer's own private trips.
  getItinerary: (id: string) => request<PublicTrip>(`/trips/${id}/itinerary`),
  publishTrip: (id: string) => request<Trip>(`/trips/${id}/publish`, { method: 'POST' }),
  unpublishTrip: (id: string) => request<Trip>(`/trips/${id}/unpublish`, { method: 'POST' }),
  likeTrip: (id: string) => request(`/trips/${id}/like`, { method: 'POST' }),
  unlikeTrip: (id: string) => request(`/trips/${id}/like`, { method: 'DELETE' }),
  addPlace: (tripId: string, input: { day: string; name: string; address?: string }) =>
    request(`/trips/${tripId}/places`, {
      method: 'POST',
      body: { day: input.day, name: input.name, address: input.address ?? '', source: 'manual' },
    }),
  updatePlace: (tripId: string, placeId: string, name: string) =>
    request(`/trips/${tripId}/places/${placeId}`, { method: 'PUT', body: { name } }),
  deletePlace: (tripId: string, placeId: string) =>
    request(`/trips/${tripId}/places/${placeId}`, { method: 'DELETE' }),
  setDayNote: (tripId: string, day: string, note: string) =>
    request(`/trips/${tripId}/day-note`, { method: 'PUT', body: { day, note } }),
  addExpense: (
    tripId: string,
    input: { day: string; name: string; category: ExpenseCategory; amountYen: number }
  ) => request(`/trips/${tripId}/expenses`, { method: 'POST', body: input }),
  updateExpense: (
    tripId: string,
    expenseId: string,
    input: { name: string; category: ExpenseCategory; amountYen: number }
  ) => request(`/trips/${tripId}/expenses/${expenseId}`, { method: 'PUT', body: input }),
  deleteExpense: (tripId: string, expenseId: string) =>
    request(`/trips/${tripId}/expenses/${expenseId}`, { method: 'DELETE' }),
  deletePhoto: (tripId: string, photoId: string) =>
    request(`/trips/${tripId}/photos/${photoId}`, { method: 'DELETE' }),
  getPhotoUploadUrl: (tripId: string, contentType: string) =>
    request<{ uploadUrl: string; key: string; publicUrl: string }>(`/trips/${tripId}/photos/upload-url`, {
      method: 'POST',
      body: { contentType },
    }),
  createPhoto: (tripId: string, input: { day: string; key: string; publicUrl: string; note?: string }) =>
    request(`/trips/${tripId}/photos`, { method: 'POST', body: input }),
  getFeed: (params: { limit?: number; offset?: number } = {}) => {
    const qs = new URLSearchParams()
    if (params.limit != null) qs.set('limit', String(params.limit))
    if (params.offset != null) qs.set('offset', String(params.offset))
    const s = qs.toString()
    return request<FeedResponse>(`/trips/feed${s ? `?${s}` : ''}`)
  },
}
