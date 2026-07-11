import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { dayKeyFromDate, japanTodayKey } from '../lib/days'
import { SwipeableRow } from '../components/SwipeableRow'

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

export function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [trips, setTrips] = useState(null)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    dailyBudget: '',
    homeCurrency: 'USD',
    tripType: 'shared',
  })

  useEffect(() => {
    api.listTrips().then(setTrips).catch((err) => setError(err.message))
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setError(null)
    const todayKey = japanTodayKey()
    if (form.startDate < todayKey) {
      setError("Trip start date can't be in the past")
      return
    }
    if (form.endDate < form.startDate) {
      setError("End date can't be before the start date")
      return
    }
    try {
      const trip = await api.createTrip({
        ...form,
        dailyBudget: Number(form.dailyBudget),
      })
      navigate(`/trips/${trip.id}`)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDeleteTrip(tripId) {
    try {
      await api.deleteTrip(tripId)
      setTrips((prev) => prev.filter((t) => t.id !== tripId))
    } catch (err) {
      setError(err.message)
    }
  }

  if (!trips) return <p className="loading-state">Loading...</p>

  const nextTrip = trips
    .map((trip) => ({ trip, countdown: tripCountdown(trip) }))
    .filter((x) => x.countdown.status !== 'past')
    .sort((a, b) => {
      if (a.countdown.status === 'ongoing') return -1
      if (b.countdown.status === 'ongoing') return 1
      return a.countdown.days - b.countdown.days
    })[0]

  return (
    <div>
      <h1>Your trips</h1>
      {error && <p className="error">{error}</p>}
      {nextTrip && (
        <div className="card countdown-banner">
          {nextTrip.countdown.status === 'ongoing' ? (
            <p>✈️ {nextTrip.trip.name} is happening now!</p>
          ) : (
            <p>
              ✈️ <strong>{nextTrip.countdown.days}</strong> day
              {nextTrip.countdown.days === 1 ? '' : 's'} until {nextTrip.trip.name}
            </p>
          )}
        </div>
      )}
      {trips.length === 0 && <p className="empty-state">No trips yet — create one below.</p>}
      <ul className="trip-card-list">
        {trips.map((trip) => {
          const card = (
            <Link className="trip-card" to={`/trips/${trip.id}`}>
              <span className="trip-card-icon">🗺️</span>
              {trip.name}
            </Link>
          )
          const canDelete = trip.createdBy === user?.id
          return (
            <li key={trip.id}>
              {canDelete ? (
                <SwipeableRow
                  actions={[
                    {
                      key: 'delete-trip',
                      icon: '🗑️',
                      label: 'Delete trip',
                      className: 'swipe-delete',
                      onClick: () => handleDeleteTrip(trip.id),
                      confirmMessage: `Delete "${trip.name}"? This removes all its expenses, places, photos, and notes for everyone. This can't be undone.`,
                    },
                  ]}
                >
                  {card}
                </SwipeableRow>
              ) : (
                card
              )}
            </li>
          )
        })}
      </ul>

      <h2 className="section-label">Create a trip</h2>
      <form className="card" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Trip name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
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
        <input
          type="number"
          placeholder="Daily budget"
          value={form.dailyBudget}
          onChange={(e) =>
            setForm({ ...form, dailyBudget: e.target.value.replace(/^0+(?=\d)/, '') })
          }
          required
        />
        <input
          type="text"
          placeholder="Home currency (e.g. USD)"
          value={form.homeCurrency}
          onChange={(e) => setForm({ ...form, homeCurrency: e.target.value })}
          required
        />
        <div className="trip-type-choice">
          <label>
            <input
              type="radio"
              name="tripType"
              value="shared"
              checked={form.tripType === 'shared'}
              onChange={(e) => setForm({ ...form, tripType: e.target.value })}
            />
            Shared trip — track who paid for each expense
          </label>
          <label>
            <input
              type="radio"
              name="tripType"
              value="family"
              checked={form.tripType === 'family'}
              onChange={(e) => setForm({ ...form, tripType: e.target.value })}
            />
            Family trip — one pot, just log the spending
          </label>
        </div>
        <button type="submit">Create trip</button>
      </form>
    </div>
  )
}
