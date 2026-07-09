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
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
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
  joinTrip: (token) => request(`/trips/join/${token}`, { method: 'POST' }),
  grantAdmin: (tripId, userId) =>
    request(`/trips/${tripId}/admins`, { method: 'POST', body: JSON.stringify({ userId }) }),
  listExpenses: (tripId, day) =>
    request(`/trips/${tripId}/expenses${day ? `?day=${day}` : ''}`),
  createExpense: (tripId, body) =>
    request(`/trips/${tripId}/expenses`, { method: 'POST', body: JSON.stringify(body) }),
  getDayNote: (tripId, day) => request(`/trips/${tripId}/day-note?day=${day}`),
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
  listPlaces: (tripId, day) => request(`/trips/${tripId}/places${day ? `?day=${day}` : ''}`),
  createPlace: (tripId, body) =>
    request(`/trips/${tripId}/places`, { method: 'POST', body: JSON.stringify(body) }),
}
