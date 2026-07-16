import { Link } from 'react-router-dom'
import { TRAVEL_TYPES } from '../lib/travelTypes'
import { CompassIcon, HeartIcon, PinIcon } from './icons'

const TRAVEL_TYPE_LABEL = Object.fromEntries(TRAVEL_TYPES.map((t) => [t.value, t.label]))

function tripMeta(trip) {
  const total = trip.dailyBudget * trip.days
  return `${trip.days} day${trip.days === 1 ? '' : 's'} · ≈ ¥${total.toLocaleString()}`
}

function LikeButton({ trip, onToggleLike, floating = false }) {
  return (
    <button
      type="button"
      className={`discover-like ${trip.likedByMe ? 'discover-like-active' : ''} ${
        floating ? 'discover-like-floating' : ''
      }`}
      aria-label={trip.likedByMe ? 'Unlike this trip' : 'Like this trip'}
      aria-pressed={trip.likedByMe}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onToggleLike(trip)
      }}
    >
      <HeartIcon filled={trip.likedByMe} />
      <span>{trip.likesCount}</span>
    </button>
  )
}

export function DiscoverTripCard({ trip, onToggleLike }) {
  return (
    <Link to={`/trips/${trip.id}/public`} className="discover-card">
      <div className="discover-card-cover">
        {trip.coverPhotoUrl ? (
          <img src={trip.coverPhotoUrl} alt="" loading="lazy" />
        ) : (
          <CompassIcon />
        )}
        <span className="discover-type-chip">{TRAVEL_TYPE_LABEL[trip.travelType]}</span>
        <LikeButton trip={trip} onToggleLike={onToggleLike} floating />
      </div>
      <div className="discover-card-body">
        <h3 className="discover-card-name">{trip.name}</h3>
        {trip.destination && (
          <p className="discover-card-destination">
            <PinIcon /> {trip.destination}
          </p>
        )}
        <p className="discover-card-meta">{tripMeta(trip)}</p>
      </div>
    </Link>
  )
}

export function DiscoverHeroCard({ trip, onToggleLike }) {
  return (
    <Link to={`/trips/${trip.id}/public`} className="discover-hero">
      {trip.coverPhotoUrl ? (
        <img src={trip.coverPhotoUrl} alt="" className="discover-hero-photo" />
      ) : (
        <div className="discover-hero-photo discover-hero-photo-empty">
          <CompassIcon size={48} />
        </div>
      )}
      <span className="discover-hero-kanji" aria-hidden="true">
        記憶
      </span>
      <span className="discover-hero-flag">Most loved</span>
      <LikeButton trip={trip} onToggleLike={onToggleLike} floating />
      <div className="discover-hero-body">
        <h2 className="discover-hero-name">{trip.name}</h2>
        <p className="discover-hero-meta">
          {trip.destination && (
            <>
              <PinIcon /> {trip.destination} ·{' '}
            </>
          )}
          {tripMeta(trip)} · {TRAVEL_TYPE_LABEL[trip.travelType]}
        </p>
      </div>
    </Link>
  )
}

export function DiscoverRailCard({ trip }) {
  return (
    <Link to={`/trips/${trip.id}/public`} className="discover-rail-card">
      <div className="discover-rail-cover">
        {trip.coverPhotoUrl ? (
          <img src={trip.coverPhotoUrl} alt="" loading="lazy" />
        ) : (
          <CompassIcon size={24} />
        )}
        {trip.likesCount > 0 && (
          <span className="discover-rail-likes">
            <HeartIcon filled size={12} /> {trip.likesCount}
          </span>
        )}
      </div>
      <h3 className="discover-rail-name">{trip.name}</h3>
      {trip.destination && <p className="discover-rail-destination">{trip.destination}</p>}
    </Link>
  )
}
