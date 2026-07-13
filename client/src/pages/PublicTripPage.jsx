import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import { formatDayLabel } from '../lib/days'
import { CATEGORIES } from '../components/ExpenseForm'
import { PlacesMap } from '../components/PlacesMap'
import { PhotoLightbox } from '../components/PhotoLightbox'

const CATEGORY_EMOJI = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.emoji]))

export function PublicTripPage() {
  const { id } = useParams()
  const [trip, setTrip] = useState(null)
  const [error, setError] = useState(null)
  const [dayIndex, setDayIndex] = useState(0)
  const [focusRequest, setFocusRequest] = useState(null)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const focusNonceRef = useRef(0)

  useEffect(() => {
    api.getPublicTrip(id).then(setTrip).catch((err) => setError(err.message))
  }, [id])

  function focusPlace(placeId) {
    focusNonceRef.current += 1
    setFocusRequest({ id: placeId, nonce: focusNonceRef.current })
  }

  if (error) return <p className="full-page-error">{error}</p>
  if (!trip) return <p className="loading-state">Loading...</p>

  const day = trip.days[dayIndex]

  return (
    <div>
      <h1>{trip.name}</h1>
      <p className="trip-meta-row">
        {new Date(trip.startDate).toLocaleDateString()} – {new Date(trip.endDate).toLocaleDateString()}
        <span className="trip-meta-sep">·</span>
        {trip.tripType === 'family' ? 'Family trip' : 'Shared trip'}
      </p>
      {trip.createdByName && <p className="public-byline">Published by {trip.createdByName}</p>}

      <div className="recap-stats">
        <div>
          <strong>{trip.stats.days}</strong>
          <span>days</span>
        </div>
        <div>
          <strong>{trip.stats.travelers}</strong>
          <span>travelers</span>
        </div>
        <div>
          <strong>{trip.stats.photos}</strong>
          <span>photos</span>
        </div>
        <div>
          <strong>{trip.stats.places}</strong>
          <span>places</span>
        </div>
      </div>
      <p className="trip-meta-row">
        Total spend: ¥{trip.stats.spendYen.toLocaleString()} ({trip.stats.spendHome.toFixed(2)}{' '}
        {trip.homeCurrency})
      </p>

      <div className="day-nav">
        {dayIndex > 0 ? (
          <button onClick={() => setDayIndex(dayIndex - 1)}>← Prev</button>
        ) : (
          <span />
        )}
        <h2>{formatDayLabel(day.day)}</h2>
        {dayIndex < trip.days.length - 1 ? (
          <button onClick={() => setDayIndex(dayIndex + 1)}>Next →</button>
        ) : (
          <span />
        )}
      </div>

      {day.note ? (
        <p className="day-note-readonly">{day.note}</p>
      ) : (
        <p className="empty-state">No note for this day.</p>
      )}

      {day.photos.length > 0 && (
        <div className="card">
          <h2 className="section-label">Photos</h2>
          <div className="photo-grid">
            {day.photos.map((p, i) => (
              <div
                key={p.id}
                className="photo-grid-item"
                onClick={() => setLightboxIndex(i)}
                role="button"
                tabIndex={0}
              >
                <img src={p.url} alt={p.note || ''} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="section-label">Expenses</h2>
        {day.expenses.length === 0 && <p className="empty-state">Nothing logged for this day.</p>}
        <ul className="expense-list">
          {day.expenses.map((e) => (
            <li key={e.id}>
              <div className="expense-row">
                <span className={`expense-icon cat-${e.category}`}>{CATEGORY_EMOJI[e.category]}</span>
                <div className="expense-info">
                  <span className="expense-name">{e.name}</span>
                </div>
                <div className="expense-amount">
                  <span className="expense-amount-yen">¥{e.amountYen.toLocaleString()}</span>
                  <span className="expense-amount-home">
                    {e.amountHome.toFixed(2)} {trip.homeCurrency}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2 className="section-label">Places</h2>
        <PlacesMap places={day.places} focusRequest={focusRequest} />
        {day.places.length === 0 && <p className="empty-state">No places logged for this day.</p>}
        <ul className="place-list">
          {day.places.map((p) => (
            <li key={p.id}>
              <div className="place-row" onClick={() => focusPlace(p.id)} role="button" tabIndex={0}>
                <span className="place-icon">📍</span>
                <div className="place-info">
                  <span className="place-name">
                    {p.name}
                    {p.address && ` — ${p.address}`}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox photos={day.photos} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </div>
  )
}
