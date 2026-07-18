import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { dayKeyFromDate, japanTodayKey } from '../lib/days'
import { SwipeableRow } from '../components/SwipeableRow'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DiscoverRailCard } from '../components/DiscoverTripCard'
import { CompassIcon, LockIcon, PinIcon, PlusIcon } from '../components/icons'
import { TRAVEL_TYPES } from '../lib/travelTypes'

function tripCountdown(trip) {
  const today = japanTodayKey()
  const startKey = dayKeyFromDate(trip.startDate)
  const endKey = dayKeyFromDate(trip.endDate)
  if (today >= startKey && today <= endKey) return { status: 'ongoing' }
  if (today < startKey) {
    const days = Math.round((new Date(startKey) - new Date(today)) / 86400000)
    return { status: 'upcoming', days }
  }
  return { status: 'past' }
}

function formatRange(trip) {
  const opts = { month: 'short', day: 'numeric' }
  const start = new Date(trip.startDate).toLocaleDateString(undefined, opts)
  const end = new Date(trip.endDate).toLocaleDateString(undefined, opts)
  return `${start} – ${end}`
}

const EMPTY_FORM = {
  name: '',
  destination: '',
  startDate: '',
  endDate: '',
  dailyBudget: '',
  homeCurrency: 'USD',
  tripType: 'shared',
  travelType: 'family',
}

export function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [trips, setTrips] = useState(null)
  const [feed, setFeed] = useState(null)
  const [error, setError] = useState(null)
  const [createError, setCreateError] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [blockedMessage, setBlockedMessage] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    api.listTrips().then(setTrips).catch((err) => setError(err.message))
    api
      .getFeed({ limit: 4 })
      .then((res) => setFeed(res.cards))
      .catch(() => setFeed([]))
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setCreateError(null)
    const todayKey = japanTodayKey()
    if (form.startDate < todayKey) {
      setCreateError("Trip start date can't be in the past")
      return
    }
    if (form.endDate < form.startDate) {
      setCreateError("End date can't be before the start date")
      return
    }
    try {
      const trip = await api.createTrip({
        ...form,
        dailyBudget: Number(form.dailyBudget),
      })
      navigate(`/trips/${trip.id}`)
    } catch (err) {
      setCreateError(err.message)
    }
  }

  function closeCreate() {
    setCreateOpen(false)
    setCreateError(null)
  }

  async function handleDeleteTrip(tripId) {
    try {
      await api.deleteTrip(tripId)
      setTrips((prev) => prev.filter((t) => t.id !== tripId))
    } catch (err) {
      setError(err.message)
    }
  }

  if (!trips) {
    return (
      <div>
        <div className="skeleton-block home-hero-skeleton" aria-hidden="true" />
        <div className="skeleton-block home-row-skeleton" aria-hidden="true" />
        <div className="skeleton-block home-row-skeleton" aria-hidden="true" />
      </div>
    )
  }

  const nextTrip = trips
    .map((trip) => ({ trip, countdown: tripCountdown(trip) }))
    .filter((x) => x.countdown.status !== 'past' && !x.trip.endedAt)
    .sort((a, b) => {
      if (a.countdown.status === 'ongoing') return -1
      if (b.countdown.status === 'ongoing') return 1
      return a.countdown.days - b.countdown.days
    })[0]

  const communityTrips = (feed ?? []).slice(0, 4)

  return (
    <div>
      {error && <p className="error">{error}</p>}

      {trips.length === 0 ? (
        <div className="home-welcome">
          <CompassIcon size={40} />
          <h1>Welcome to Kioku</h1>
          <p>
            Plan your next trip with the people you travel with, or explore trips other
            travelers have shared.
          </p>
          <div className="home-welcome-actions">
            <button type="button" onClick={() => setCreateOpen(true)}>
              <PlusIcon /> Plan a trip
            </button>
            <Link to="/discover" className="btn-secondary">
              Explore trips
            </Link>
          </div>
        </div>
      ) : (
        <>
          <header className="home-head">
            <h1>Your trips</h1>
            <button type="button" className="home-new-trip" onClick={() => setCreateOpen(true)}>
              <PlusIcon /> New trip
            </button>
          </header>

          {nextTrip && (
            <Link to={`/trips/${nextTrip.trip.id}`} className="home-hero">
              <span className="home-hero-kanji" aria-hidden="true">
                旅
              </span>
              <div className="home-hero-content">
                {nextTrip.countdown.status === 'ongoing' ? (
                  <>
                    <span className="home-hero-label">Happening now</span>
                    <span className="home-hero-name">{nextTrip.trip.name}</span>
                  </>
                ) : (
                  <>
                    <span className="home-hero-count">{nextTrip.countdown.days}</span>
                    <span className="home-hero-label">
                      day{nextTrip.countdown.days === 1 ? '' : 's'} until
                    </span>
                    <span className="home-hero-name">{nextTrip.trip.name}</span>
                  </>
                )}
                <span className="home-hero-sub">
                  {nextTrip.trip.destination && (
                    <>
                      <PinIcon /> {nextTrip.trip.destination} ·{' '}
                    </>
                  )}
                  {formatRange(nextTrip.trip)}
                </span>
              </div>
            </Link>
          )}

          <ul className="trip-card-list">
            {trips.map((trip) => {
              const canDelete = trip.createdBy === user?.id
              const creatorName = trip.createdByName || 'the trip creator'
              return (
                <li key={trip.id}>
                  <SwipeableRow
                    actions={[
                      {
                        key: 'delete-trip',
                        icon: '🗑️',
                        label: 'Delete trip',
                        className: canDelete ? 'swipe-delete' : 'swipe-delete swipe-disabled',
                        onClick: canDelete
                          ? () => handleDeleteTrip(trip.id)
                          : () =>
                              setBlockedMessage(
                                `Only the person who created this trip can delete it (${creatorName}).`
                              ),
                        confirmMessage: canDelete
                          ? `Delete "${trip.name}"? This removes all its expenses, places, photos, and notes for everyone. This can't be undone.`
                          : undefined,
                      },
                    ]}
                  >
                    <Link className="trip-card" to={`/trips/${trip.id}`}>
                      <span className="trip-card-icon">
                        <CompassIcon size={18} />
                      </span>
                      <span className="trip-card-info">
                        <span className="trip-card-name">{trip.name}</span>
                        <span className="trip-card-sub">
                          {trip.destination ? `${trip.destination} · ` : ''}
                          {formatRange(trip)}
                        </span>
                      </span>
                      {trip.endedAt && (
                        <span className="trip-card-ended">
                          <LockIcon /> Ended
                        </span>
                      )}
                    </Link>
                  </SwipeableRow>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {communityTrips.length > 0 && (
        <section className="home-community">
          <div className="home-community-head">
            <h2 className="section-label">From the community</h2>
            <Link to="/discover" className="home-see-all">
              See all
            </Link>
          </div>
          <div className="discover-rail">
            {communityTrips.map((trip) => (
              <DiscoverRailCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {blockedMessage && (
        <ConfirmDialog mode="info" message={blockedMessage} onCancel={() => setBlockedMessage(null)} />
      )}

      {createOpen && (
        <div className="sheet-backdrop" onClick={closeCreate}>
          <div className="sheet home-create-sheet" onClick={(e) => e.stopPropagation()}>
            <h2 className="home-create-title">New trip</h2>
            <form onSubmit={handleCreate}>
              <label>
                Trip name
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Destination
                <input
                  type="text"
                  placeholder="e.g. Tokyo, Japan"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                />
                <span className="field-hint">Optional — helps others find it if published</span>
              </label>
              <div className="discover-filter-row">
                <label>
                  Start date
                  <input
                    type="date"
                    min={japanTodayKey()}
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    required
                  />
                </label>
                <label>
                  End date
                  <input
                    type="date"
                    min={form.startDate || japanTodayKey()}
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    required
                  />
                </label>
              </div>
              <div className="discover-filter-row">
                <label>
                  Daily budget
                  <input
                    type="number"
                    value={form.dailyBudget}
                    onChange={(e) =>
                      setForm({ ...form, dailyBudget: e.target.value.replace(/^0+(?=\d)/, '') })
                    }
                    required
                  />
                </label>
                <label>
                  Home currency
                  <input
                    type="text"
                    placeholder="e.g. USD"
                    value={form.homeCurrency}
                    onChange={(e) => setForm({ ...form, homeCurrency: e.target.value })}
                    required
                  />
                </label>
              </div>
              <div className="trip-type-choice">
                <label>
                  <input
                    type="radio"
                    name="tripType"
                    value="shared"
                    checked={form.tripType === 'shared'}
                    onChange={(e) => setForm({ ...form, tripType: e.target.value })}
                  />
                  Shared expenses — track who paid for each expense
                </label>
                <label>
                  <input
                    type="radio"
                    name="tripType"
                    value="family"
                    checked={form.tripType === 'family'}
                    onChange={(e) => setForm({ ...form, tripType: e.target.value })}
                  />
                  One pot — just log the spending, no splitting
                </label>
              </div>
              <label>
                Who's traveling?
                <select
                  value={form.travelType}
                  onChange={(e) => setForm({ ...form, travelType: e.target.value })}
                >
                  {TRAVEL_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              {createError && <p className="error">{createError}</p>}
              <button type="submit">Create trip</button>
              <button type="button" className="sheet-cancel" onClick={closeCreate}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
