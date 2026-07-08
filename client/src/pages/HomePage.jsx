import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { japanTodayKey } from '../lib/days'

export function HomePage() {
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
      setTrips((prev) => [...(prev || []), trip])
      setForm({
        name: '',
        startDate: '',
        endDate: '',
        dailyBudget: '',
        homeCurrency: 'USD',
        tripType: 'shared',
      })
    } catch (err) {
      setError(err.message)
    }
  }

  if (!trips) return <p>Loading...</p>

  return (
    <div>
      <h1>Your trips</h1>
      {error && <p className="error">{error}</p>}
      {trips.length === 0 && <p>No trips yet — create one below.</p>}
      <ul className="trip-list">
        {trips.map((trip) => (
          <li key={trip.id}>
            <Link to={`/trips/${trip.id}`}>{trip.name}</Link>
          </li>
        ))}
      </ul>

      <h2>Create a trip</h2>
      <form onSubmit={handleCreate}>
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
