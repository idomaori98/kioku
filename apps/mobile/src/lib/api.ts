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
  createdBy: string
  createdByName: string | null
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

export type UserLite = { id: string; name: string; photoUrl?: string }

// GET /notifications — see server/routes/notifications.js.
export type NotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'trip_copied'
  | 'friend_request'
  | 'friend_accept'

export type AppNotification = {
  id: string
  type: NotificationType
  read: boolean
  createdAt: string
  actor: { id: string; name: string; photoUrl?: string } | null
  tripId: string | null
  tripName: string
}

// GET /users/:id — public profile (see server/routes/users.js).
export type UserProfile = {
  id: string
  name: string
  photoUrl?: string
  isMe: boolean
  isFollowedByMe: boolean
  followerCount: number
  followingCount: number
  tripCount: number
  trips: FeedCard[]
}

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

// GET /trips/:id/recap (member-gated) — see server/routes/recap.js.
export type Recap = {
  totals: {
    days: number
    travelers: number
    photos: number
    places: number
    spendYen: number
    spendHome: number
    homeCurrency: string
  }
  spendingByCategory: { category: ExpenseCategory; yen: number; home: number }[]
  photos: { id: string; url: string; day: string }[]
  places: { id: string; name: string; lat: number; lng: number; day: string }[]
  days: {
    day: string
    note: string
    expenseYen: number
    expenseHome: number
    photoCount: number
    placeCount: number
  }[]
}

// GET/POST /trips/:tripId/comments (published trips only) — see server/routes/comments.js.
export type TripComment = {
  id: string
  text: string
  createdAt: string
  user: { id: string; name: string; photoUrl?: string }
}

// GET /dm/* — direct messages (see server/routes/directMessages.js).
export type Conversation = {
  user: { id: string; name: string; photoUrl?: string }
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

export type DirectMessage = {
  id: string
  senderId: string
  text: string
  createdAt: string
  sharedTrip: { id: string; name: string; destination: string; coverPhotoUrl: string } | null
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
  getRecap: (id: string) => request<Recap>(`/trips/${id}/recap`),
  publishTrip: (id: string) => request<Trip>(`/trips/${id}/publish`, { method: 'POST' }),
  unpublishTrip: (id: string) => request<Trip>(`/trips/${id}/unpublish`, { method: 'POST' }),
  likeTrip: (id: string) => request(`/trips/${id}/like`, { method: 'POST' }),
  unlikeTrip: (id: string) => request(`/trips/${id}/like`, { method: 'DELETE' }),
  getComments: (tripId: string) => request<TripComment[]>(`/trips/${tripId}/comments`),
  addComment: (tripId: string, text: string) =>
    request<TripComment>(`/trips/${tripId}/comments`, { method: 'POST', body: { text } }),
  deleteComment: (tripId: string, commentId: string) =>
    request(`/trips/${tripId}/comments/${commentId}`, { method: 'DELETE' }),
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
  getFeed: (params: { limit?: number; offset?: number; scope?: 'following' } = {}) => {
    const qs = new URLSearchParams()
    if (params.limit != null) qs.set('limit', String(params.limit))
    if (params.offset != null) qs.set('offset', String(params.offset))
    if (params.scope) qs.set('scope', params.scope)
    const s = qs.toString()
    return request<FeedResponse>(`/trips/feed${s ? `?${s}` : ''}`)
  },
  getProfile: (id: string) => request<UserProfile>(`/users/${id}`),
  followUser: (id: string) => request(`/users/${id}/follow`, { method: 'POST' }),
  unfollowUser: (id: string) => request(`/users/${id}/follow`, { method: 'DELETE' }),
  getFollowers: (id: string) => request<UserLite[]>(`/users/${id}/followers`),
  getFollowing: (id: string) => request<UserLite[]>(`/users/${id}/following`),
  searchUsers: (q: string) => request<UserLite[]>(`/users/search?q=${encodeURIComponent(q)}`),
  getNotifications: () => request<AppNotification[]>('/notifications'),
  getUnreadCount: () => request<{ count: number }>('/notifications/unread-count'),
  markAllNotificationsRead: () => request<{ ok: boolean }>('/notifications/read-all', { method: 'POST' }),
  getConversations: () => request<Conversation[]>('/dm/conversations'),
  getMessages: (userId: string) => request<DirectMessage[]>(`/dm/${userId}`),
  sendMessage: (userId: string, body: { text?: string; sharedTripId?: string }) =>
    request<DirectMessage>(`/dm/${userId}`, { method: 'POST', body }),
  getDmUnreadCount: () => request<{ count: number }>('/dm/unread-count'),
}
