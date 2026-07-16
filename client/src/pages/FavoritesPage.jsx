import { useEffect, useState } from 'react'
import { api } from '../api'
import { DiscoverTripCard } from '../components/DiscoverTripCard'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { BookmarkIcon } from '../components/icons'

export function FavoritesPage() {
  const [cards, setCards] = useState(null)
  const [error, setError] = useState(null)

  function load() {
    setError(null)
    setCards(null)
    api.getFavorites().then(setCards).catch((err) => setError(err.message))
  }

  useEffect(() => {
    load()
  }, [])

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
      <header className="discover-head">
        <h1>Favorites</h1>
        <p className="discover-tagline">Trips you've saved</p>
      </header>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !cards ? (
        <div className="discover-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton-block discover-card-skeleton" aria-hidden="true" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <EmptyState
          icon={BookmarkIcon}
          title="No saved trips yet"
          message="Tap Save on any published trip and it'll show up here for later."
          actionLabel="Explore trips"
          actionTo="/discover"
        />
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
