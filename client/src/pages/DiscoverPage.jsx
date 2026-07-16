import { useEffect, useState } from 'react'
import { api } from '../api'
import {
  DiscoverHeroCard,
  DiscoverRailCard,
  DiscoverTripCard,
} from '../components/DiscoverTripCard'
import { ArrowRightIcon, ChevronDownIcon, SearchIcon } from '../components/icons'
import { TRAVEL_TYPES } from '../lib/travelTypes'

export function DiscoverPage() {
  const [cards, setCards] = useState(null)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState('feed')
  const [filtersOpen, setFiltersOpen] = useState(false)
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
    setCards(null)
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
    setCards(null)
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

  const isFeed = mode === 'feed'
  const hero = isFeed && cards?.length ? cards[0] : null
  const rail = isFeed && cards ? cards.slice(1, 7) : []
  const gridCards = cards ? (isFeed ? cards.slice(7) : cards) : []

  return (
    <div>
      <header className="discover-head">
        <h1>Discover</h1>
        <p className="discover-tagline">Trips shared by fellow travelers</p>
      </header>
      {error && <p className="error">{error}</p>}

      {!cards && isFeed ? (
        <div className="skeleton-block discover-hero-skeleton" aria-hidden="true" />
      ) : hero ? (
        <DiscoverHeroCard trip={hero} onToggleLike={toggleLike} />
      ) : null}

      <form
        className={`discover-search ${hero || (!cards && isFeed) ? 'discover-search-overlap' : ''}`}
        onSubmit={handleSearch}
      >
        <div className="discover-search-pill">
          <SearchIcon />
          <input
            type="search"
            placeholder="Where to next?"
            aria-label="Search by destination"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="discover-search-go" aria-label="Search">
            <ArrowRightIcon />
          </button>
        </div>
        <button
          type="button"
          className="discover-filters-toggle"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          Filters <ChevronDownIcon />
        </button>
        {filtersOpen && (
          <div className="discover-filters">
            <label>
              Travel type
              <select value={travelType} onChange={(e) => setTravelType(e.target.value)}>
                <option value="">Any type</option>
                {TRAVEL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="discover-filter-row">
              <label>
                Min days
                <input
                  type="number"
                  min="1"
                  value={minLength}
                  onChange={(e) => setMinLength(e.target.value)}
                />
              </label>
              <label>
                Max days
                <input
                  type="number"
                  min="1"
                  value={maxLength}
                  onChange={(e) => setMaxLength(e.target.value)}
                />
              </label>
            </div>
            <div className="discover-filter-row">
              <label>
                Min budget (¥)
                <input
                  type="number"
                  min="0"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                />
              </label>
              <label>
                Max budget (¥)
                <input
                  type="number"
                  min="0"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                />
              </label>
            </div>
            <div className="discover-filter-actions">
              <button type="submit">Apply filters</button>
              <button type="button" className="btn-secondary" onClick={clearSearch}>
                Reset
              </button>
            </div>
          </div>
        )}
      </form>

      {!cards ? (
        <div className="discover-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton-block discover-card-skeleton" aria-hidden="true" />
          ))}
        </div>
      ) : (
        <>
          {mode === 'search' && (
            <div className="discover-results-head">
              <h2 className="section-label">
                {cards.length === 0
                  ? 'No results'
                  : `${cards.length} trip${cards.length === 1 ? '' : 's'} found`}
              </h2>
              <button type="button" className="btn-secondary btn-sm" onClick={clearSearch}>
                Clear search
              </button>
            </div>
          )}

          {rail.length > 0 && (
            <section className="discover-section">
              <h2 className="section-label">Popular now</h2>
              <div className="discover-rail">
                {rail.map((trip) => (
                  <DiscoverRailCard key={trip.id} trip={trip} />
                ))}
              </div>
            </section>
          )}

          {gridCards.length > 0 && (
            <section className="discover-section">
              {isFeed && <h2 className="section-label">More trips</h2>}
              <div className="discover-grid">
                {gridCards.map((trip) => (
                  <DiscoverTripCard key={trip.id} trip={trip} onToggleLike={toggleLike} />
                ))}
              </div>
            </section>
          )}

          {cards.length === 0 && (
            <p className="empty-state">
              {mode === 'search'
                ? 'No trips match this search. Try another destination or widen the filters.'
                : 'No published trips yet. Publish one of yours to start the feed.'}
            </p>
          )}
        </>
      )}
    </div>
  )
}
