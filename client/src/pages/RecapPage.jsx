import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import { formatDayLabel } from '../lib/days'
import { CATEGORIES } from '../components/ExpenseForm'
import { RecapMap } from '../components/RecapMap'
import { PhotoLightbox } from '../components/PhotoLightbox'

const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]))
const CATEGORY_EMOJI = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.emoji]))

export function RecapPage() {
  const { id } = useParams()
  const [trip, setTrip] = useState(null)
  const [recap, setRecap] = useState(null)
  const [error, setError] = useState(null)
  const [dayIndex, setDayIndex] = useState(0)
  const [shared, setShared] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  useEffect(() => {
    Promise.all([api.getTrip(id), api.getRecap(id)])
      .then(([t, r]) => {
        setTrip(t)
        setRecap(r)
      })
      .catch((err) => setError(err.message))
  }, [id])

  async function handleShare() {
    const shareData = {
      title: trip ? `${trip.name} — Kioku recap` : 'Kioku recap',
      url: window.location.href,
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled the share sheet — nothing to do.
      }
      return
    }
    await navigator.clipboard.writeText(window.location.href)
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  if (error) return <p className="full-page-error">{error}</p>
  if (!trip || !recap) return <p className="loading-state">Loading...</p>

  const maxCategoryYen = Math.max(...recap.spendingByCategory.map((c) => c.yen), 1)
  const day = recap.days[dayIndex]

  return (
    <div>
      <h1>{trip.name} — Recap</h1>

      <div className="recap-stats">
        <div>
          <strong>{recap.totals.days}</strong>
          <span>days</span>
        </div>
        <div>
          <strong>{recap.totals.travelers}</strong>
          <span>travelers</span>
        </div>
        <div>
          <strong>{recap.totals.photos}</strong>
          <span>photos</span>
        </div>
        <div>
          <strong>{recap.totals.places}</strong>
          <span>places</span>
        </div>
      </div>
      <p className="trip-meta-row">
        Total spend: ¥{recap.totals.spendYen.toLocaleString()} ({recap.totals.spendHome.toFixed(2)}{' '}
        {recap.totals.homeCurrency})
      </p>

      {recap.spendingByCategory.length > 0 && (
        <div className="card">
          <h2 className="section-label">Spending by category</h2>
          <div className="category-bars">
            {recap.spendingByCategory.map((c) => (
              <div className="category-bar-row" key={c.category}>
                <span className="category-bar-label">
                  {CATEGORY_EMOJI[c.category]} {CATEGORY_LABEL[c.category]}
                </span>
                <div className="category-bar-track">
                  <div
                    className={`category-bar-fill cat-${c.category}`}
                    style={{ width: `${(c.yen / maxCategoryYen) * 100}%` }}
                  />
                </div>
                <span className="category-bar-amount">¥{c.yen.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {recap.places.length > 0 && (
        <div className="card">
          <h2 className="section-label">Route</h2>
          <RecapMap places={recap.places} />
        </div>
      )}

      {recap.photos.length > 0 && (
        <div className="card">
          <h2 className="section-label">Highlights</h2>
          <div className="photo-grid recap-highlights">
            {recap.photos.map((p, i) => (
              <div
                key={p.id}
                className="photo-grid-item"
                onClick={() => setLightboxIndex(i)}
                role="button"
                tabIndex={0}
              >
                <img src={p.url} alt="" />
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="section-label">Day by day</h2>
      <div className="day-nav">
        {dayIndex > 0 ? (
          <button onClick={() => setDayIndex(dayIndex - 1)}>← Prev</button>
        ) : (
          <span />
        )}
        <h3>{formatDayLabel(day.day)}</h3>
        {dayIndex < recap.days.length - 1 ? (
          <button onClick={() => setDayIndex(dayIndex + 1)}>Next →</button>
        ) : (
          <span />
        )}
      </div>
      <div className="recap-day-page">
        {day.note ? <p className="day-note-readonly">{day.note}</p> : <p className="empty-state">No note for this day.</p>}
        <p>
          ¥{day.expenseYen.toLocaleString()} ({day.expenseHome.toFixed(2)} {recap.totals.homeCurrency})
          spent · {day.photoCount} photo{day.photoCount === 1 ? '' : 's'} · {day.placeCount} place
          {day.placeCount === 1 ? '' : 's'}
        </p>
      </div>

      <button onClick={handleShare}>{shared ? 'Link copied!' : 'Share recap'}</button>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={recap.photos}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}
