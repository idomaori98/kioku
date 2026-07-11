import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { formatDayLabel } from '../lib/days'
import { CATEGORIES } from '../components/ExpenseForm'

const CATEGORY_EMOJI = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.emoji]))

export function SearchPage() {
  const { id } = useParams()
  const [trip, setTrip] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [places, setPlaces] = useState([])
  const [notes, setNotes] = useState([])
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    Promise.all([api.getTrip(id), api.listExpenses(id), api.listPlaces(id), api.listDayNotes(id)])
      .then(([t, e, p, n]) => {
        setTrip(t)
        setExpenses(e)
        setPlaces(p)
        setNotes(n.filter((note) => note.note))
      })
      .catch((err) => setError(err.message))
  }, [id])

  if (error) return <p className="full-page-error">{error}</p>
  if (!trip) return <p className="loading-state">Loading...</p>

  const q = query.trim().toLowerCase()
  const filteredExpenses = expenses.filter((e) => {
    if (category && e.category !== category) return false
    if (q && !e.name.toLowerCase().includes(q)) return false
    return true
  })
  const filteredPlaces = places.filter(
    (p) => !q || p.name.toLowerCase().includes(q) || (p.address || '').toLowerCase().includes(q)
  )
  const filteredNotes = notes.filter((n) => !q || n.note.toLowerCase().includes(q))
  const noResults =
    filteredExpenses.length === 0 && filteredPlaces.length === 0 && filteredNotes.length === 0

  return (
    <div>
      <h1>Search {trip.name}</h1>
      <p>
        <Link className="btn-secondary btn-sm" to={`/trips/${id}`}>
          ← Back to trip
        </Link>
      </p>

      <input
        type="text"
        placeholder="Search expenses, places, notes..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="category-chips">
        <button
          type="button"
          className={`chip ${!category ? 'chip-selected' : ''}`}
          onClick={() => setCategory('')}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            type="button"
            key={c.value}
            className={`chip cat-${c.value} ${category === c.value ? 'chip-selected' : ''}`}
            onClick={() => setCategory(category === c.value ? '' : c.value)}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {filteredExpenses.length > 0 && (
        <div className="card">
          <h2 className="section-label">Expenses ({filteredExpenses.length})</h2>
          <ul className="expense-list">
            {filteredExpenses.map((e) => (
              <li key={e.id}>
                <div className="expense-row">
                  <span className={`expense-icon cat-${e.category}`}>
                    {CATEGORY_EMOJI[e.category]}
                  </span>
                  <div className="expense-info">
                    <span className="expense-name">{e.name}</span>
                    <span className="expense-meta">{formatDayLabel(e.day)}</span>
                  </div>
                  <div className="expense-amount">
                    <span className="expense-amount-yen">¥{e.amountYen.toLocaleString()}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {filteredPlaces.length > 0 && (
        <div className="card">
          <h2 className="section-label">Places ({filteredPlaces.length})</h2>
          <ul className="place-list">
            {filteredPlaces.map((p) => (
              <li key={p.id}>
                <div className="place-row">
                  <span className="place-icon">📍</span>
                  <div className="place-info">
                    <span className="place-name">
                      {p.name}
                      {p.address && ` — ${p.address}`}
                    </span>
                    <span className="place-meta">{formatDayLabel(p.day)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {filteredNotes.length > 0 && (
        <div className="card">
          <h2 className="section-label">Notes ({filteredNotes.length})</h2>
          {filteredNotes.map((n) => (
            <div key={n.day} className="recap-day-page">
              <p className="day-note-readonly">{n.note}</p>
              <p className="place-meta">{formatDayLabel(n.day)}</p>
            </div>
          ))}
        </div>
      )}

      {noResults && <p className="empty-state">No matches.</p>}
    </div>
  )
}
