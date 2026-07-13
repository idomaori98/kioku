import { Link } from 'react-router-dom'
import { TRAVEL_TYPES } from '../lib/travelTypes'

const TRAVEL_TYPE_LABEL = Object.fromEntries(TRAVEL_TYPES.map((t) => [t.value, t.label]))

export function DiscoverTripCard({ trip, onToggleLike }) {
  return (
    <Link to={`/trips/${trip.id}/public`} className="discover-card">
      <div className="discover-card-cover">
        {trip.coverPhotoUrl ? (
          <img src={trip.coverPhotoUrl} alt="" />
        ) : (
          <span className="discover-card-cover-placeholder">🗺️</span>
        )}
      </div>
      <div className="discover-card-body">
        <h3 className="discover-card-name">{trip.name}</h3>
        {trip.destination && <p className="discover-card-destination">📍 {trip.destination}</p>}
        <p className="discover-card-meta">
          {trip.days} day{trip.days === 1 ? '' : 's'} · ¥{(trip.dailyBudget * trip.days).toLocaleString()}{' '}
          ballpark · {TRAVEL_TYPE_LABEL[trip.travelType]}
        </p>
        <button
          type="button"
          className={`discover-like-btn ${trip.likedByMe ? 'discover-like-btn-active' : ''}`}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleLike(trip)
          }}
        >
          {trip.likedByMe ? '❤️' : '🤍'} {trip.likesCount}
        </button>
      </div>
    </Link>
  )
}
