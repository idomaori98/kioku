const TOKEN_KEY = 'kioku_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request(path, options = {}) {
  const token = getToken()
  let res
  try {
    res = await fetch(`/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error("You're offline — check your connection and try again")
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export const api = {
  signup: (body) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  loginWithGoogle: (idToken) =>
    request('/auth/google', { method: 'POST', body: JSON.stringify({ idToken }) }),
  me: () => request('/auth/me'),
  getProfilePhotoUploadUrl: (contentType) =>
    request('/auth/me/photo-upload-url', { method: 'POST', body: JSON.stringify({ contentType }) }),
  updateProfilePhoto: (photoUrl) =>
    request('/auth/me', { method: 'PUT', body: JSON.stringify({ photoUrl }) }),
  listTrips: () => request('/trips'),
  createTrip: (body) => request('/trips', { method: 'POST', body: JSON.stringify(body) }),
  getTrip: (id) => request(`/trips/${id}`),
  updateTrip: (id, body) => request(`/trips/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTrip: (id) => request(`/trips/${id}`, { method: 'DELETE' }),
  endTrip: (id) => request(`/trips/${id}/end`, { method: 'POST' }),
  joinTrip: (token) => request(`/trips/join/${token}`, { method: 'POST' }),
  grantAdmin: (tripId, userId) =>
    request(`/trips/${tripId}/admins`, { method: 'POST', body: JSON.stringify({ userId }) }),
  getMemberActivity: (tripId, userId) => request(`/trips/${tripId}/members/${userId}/activity`),
  listExpenses: (tripId, day) =>
    request(`/trips/${tripId}/expenses${day ? `?day=${day}` : ''}`),
  createExpense: (tripId, body) =>
    request(`/trips/${tripId}/expenses`, { method: 'POST', body: JSON.stringify(body) }),
  updateExpense: (tripId, expenseId, body) =>
    request(`/trips/${tripId}/expenses/${expenseId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteExpense: (tripId, expenseId) =>
    request(`/trips/${tripId}/expenses/${expenseId}`, { method: 'DELETE' }),
  reorderExpenses: (tripId, day, orderedIds) =>
    request(`/trips/${tripId}/expenses/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ day, orderedIds }),
    }),
  getDayNote: (tripId, day) => request(`/trips/${tripId}/day-note?day=${day}`),
  listDayNotes: (tripId) => request(`/trips/${tripId}/day-note`),
  setDayNote: (tripId, day, note) =>
    request(`/trips/${tripId}/day-note`, { method: 'PUT', body: JSON.stringify({ day, note }) }),
  listPhotos: (tripId, day) => request(`/trips/${tripId}/photos${day ? `?day=${day}` : ''}`),
  getPhotoUploadUrl: (tripId, contentType) =>
    request(`/trips/${tripId}/photos/upload-url`, {
      method: 'POST',
      body: JSON.stringify({ contentType }),
    }),
  createPhoto: (tripId, body) =>
    request(`/trips/${tripId}/photos`, { method: 'POST', body: JSON.stringify(body) }),
  updatePhotoNote: (tripId, photoId, note) =>
    request(`/trips/${tripId}/photos/${photoId}`, {
      method: 'PUT',
      body: JSON.stringify({ note }),
    }),
  deletePhoto: (tripId, photoId) =>
    request(`/trips/${tripId}/photos/${photoId}`, { method: 'DELETE' }),
  reorderPhotos: (tripId, day, orderedIds) =>
    request(`/trips/${tripId}/photos/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ day, orderedIds }),
    }),
  listPlaces: (tripId, day) => request(`/trips/${tripId}/places${day ? `?day=${day}` : ''}`),
  createPlace: (tripId, body) =>
    request(`/trips/${tripId}/places`, { method: 'POST', body: JSON.stringify(body) }),
  updatePlace: (tripId, placeId, body) =>
    request(`/trips/${tripId}/places/${placeId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePlace: (tripId, placeId) =>
    request(`/trips/${tripId}/places/${placeId}`, { method: 'DELETE' }),
  reorderPlaces: (tripId, day, orderedIds) =>
    request(`/trips/${tripId}/places/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ day, orderedIds }),
    }),
  getRecap: (tripId) => request(`/trips/${tripId}/recap`),
  listMessages: (tripId) => request(`/trips/${tripId}/messages`),
  sendMessage: (tripId, text) =>
    request(`/trips/${tripId}/messages`, { method: 'POST', body: JSON.stringify({ text }) }),
  getBalances: (tripId) => request(`/trips/${tripId}/balances`),
}
