import { useEffect, useState } from 'react'
import { api } from '../api'
import { DiscoverTripCard } from '../components/DiscoverTripCard'

export function FavoritesPage() {
  const [cards, setCards] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getFavorites().then(setCards).catch((err) => setError(err.message))
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

  if (error) return <p className="full-page-error">{error}</p>
  if (!cards) return <p className="loading-state">Loading...</p>

  return (
    <div>
      <h1>Favorites</h1>
      {cards.length === 0 ? (
        <p className="empty-state">No saved trips yet — save one from Discover.</p>
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
