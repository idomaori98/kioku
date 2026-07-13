import { useEffect, useState } from 'react'
import { api } from '../api'
import { DiscoverTripCard } from '../components/DiscoverTripCard'
import { TRAVEL_TYPES } from '../lib/travelTypes'

export function DiscoverPage() {
  const [cards, setCards] = useState(null)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState('feed')
  const [query, setQuery] = useState('')
  const [travelType, setTravelType] = useState('')
  const [minBudget, setMinBudget] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [minLength, setMinLength] = useState('')
  const [maxLength, setMaxLength] = useState('')

  function loadFeed() {
    setError(null)
    api.getFeed().then(setCards).catch((err) => setError(err.message))
  }

  useEffect(() => {
    loadFeed()
  }, [])

  async function handleSearch(e) {
    e.preventDefault()
    setError(null)
    setMode('search')
    try {
      const results = await api.searchDiscover({
        q: query,
        travelType,
        minBudget,
        maxBudget,
        minLength,
        maxLength,
      })
      setCards(results)
    } catch (err) {
      setError(err.message)
    }
  }

  function clearSearch() {
    setQuery('')
    setTravelType('')
    setMinBudget('')
    setMaxBudget('')
    setMinLength('')
    setMaxLength('')
    setMode('feed')
    loadFeed()
  }

  async function toggleLike(trip) {
    const optimistic = trip.likedByMe
      ? { ...trip, likedByMe: false, likesCount: trip.likesCount - 1 }
      : { ...trip, likedByMe: true, likesCount: trip.likesCount + 1 }
    setCards((prev) => prev.map((c) => (c.id === trip.id ? optimistic : c)))
    try {
      const result = trip.likedByMe ? await api.unlikeTrip(trip.id) : await api.likeTrip(trip.id)
      setCards((prev) =>
        prev.map((c) =>
          c.id === trip.id ? { ...c, likesCount: result.likesCount, likedByMe: result.likedByMe } : c
        )
      )
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <h1>Discover trips</h1>
      {error && <p className="error">{error}</p>}

      <form className="card discover-search-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search by destination..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="discover-filter-row">
          <select value={travelType} onChange={(e) => setTravelType(e.target.value)}>
            <option value="">Any type</option>
            {TRAVEL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Min days"
            value={minLength}
            onChange={(e) => setMinLength(e.target.value)}
          />
          <input
            type="number"
            placeholder="Max days"
            value={maxLength}
            onChange={(e) => setMaxLength(e.target.value)}
          />
        </div>
        <div className="discover-filter-row">
          <input
            type="number"
            placeholder="Min budget (¥)"
            value={minBudget}
            onChange={(e) => setMinBudget(e.target.value)}
          />
          <input
            type="number"
            placeholder="Max budget (¥)"
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
          />
        </div>
        <div className="discover-filter-actions">
          <button type="submit">Search</button>
          {mode === 'search' && (
            <button type="button" className="btn-secondary" onClick={clearSearch}>
              Clear
            </button>
          )}
        </div>
      </form>

      <h2 className="section-label">{mode === 'search' ? 'Search results' : 'Popular'}</h2>
      {!cards ? (
        <p className="loading-state">Loading...</p>
      ) : cards.length === 0 ? (
        <p className="empty-state">
          {mode === 'search' ? 'No trips match your search.' : 'No published trips yet.'}
        </p>
      ) : (
        <div className="discover-grid">
          {cards.map((trip) => (
            <DiscoverTripCard key={trip.id} trip={trip} onToggleLike={toggleLike} />
          ))}
        </div>
      )}
    </div>
  )
}
