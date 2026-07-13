import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { formatDayLabel } from '../lib/days'
import { CATEGORIES } from '../components/ExpenseForm'

const CATEGORY_EMOJI = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.emoji]))

export function PublicationEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [photos, setPhotos] = useState([])
  const [hiddenExpenseIds, setHiddenExpenseIds] = useState(new Set())
  const [hiddenPhotoIds, setHiddenPhotoIds] = useState(new Set())
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([api.getTrip(id), api.listExpenses(id), api.listPhotos(id)])
      .then(([t, e, p]) => {
        setTrip(t)
        setExpenses(e)
        setPhotos(p)
        setHiddenExpenseIds(new Set(e.filter((x) => x.hiddenFromPublic).map((x) => x.id)))
        setHiddenPhotoIds(new Set(p.filter((x) => x.hiddenFromPublic).map((x) => x.id)))
      })
      .catch((err) => setError(err.message))
  }, [id])

  function toggleExpense(expenseId) {
    setHiddenExpenseIds((prev) => {
      const next = new Set(prev)
      if (next.has(expenseId)) next.delete(expenseId)
      else next.add(expenseId)
      return next
    })
  }

  function togglePhoto(photoId) {
    setHiddenPhotoIds((prev) => {
      const next = new Set(prev)
      if (next.has(photoId)) next.delete(photoId)
      else next.add(photoId)
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await api.updatePublication(id, {
        hiddenExpenseIds: [...hiddenExpenseIds],
        hiddenPhotoIds: [...hiddenPhotoIds],
      })
      if (!trip.published) {
        await api.publishTrip(id)
      }
      navigate(`/trips/${id}`)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (error && !trip) return <p className="full-page-error">{error}</p>
  if (!trip) return <p className="loading-state">Loading...</p>

  return (
    <div>
      <h1>Edit publication</h1>
      <p>
        <Link className="btn-secondary btn-sm" to={`/trips/${id}`}>
          ← Back to trip
        </Link>
      </p>
      <p className="trip-meta-row">
        Choose what shows on the public page for <strong>{trip.name}</strong>. Places, route, and day
        notes are always included; you can hide individual photos or expenses.
      </p>

      <div className="card">
        <div className="publication-section-header">
          <h2 className="section-label">Expenses ({expenses.length - hiddenExpenseIds.size} visible)</h2>
          <div className="publication-shortcuts">
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => setHiddenExpenseIds(new Set(expenses.map((e) => e.id)))}
            >
              Hide all
            </button>
            <button type="button" className="btn-secondary btn-sm" onClick={() => setHiddenExpenseIds(new Set())}>
              Show all
            </button>
          </div>
        </div>
        {expenses.length === 0 && <p className="empty-state">No expenses logged yet.</p>}
        <ul className="publication-list">
          {expenses.map((e) => (
            <li key={e.id} className="publication-row">
              <label>
                <input
                  type="checkbox"
                  checked={!hiddenExpenseIds.has(e.id)}
                  onChange={() => toggleExpense(e.id)}
                />
                <span className="publication-item-icon">{CATEGORY_EMOJI[e.category]}</span>
                <span className="publication-item-name">{e.name}</span>
                <span className="publication-item-meta">
                  ¥{e.amountYen.toLocaleString()} · {formatDayLabel(e.day)}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <div className="publication-section-header">
          <h2 className="section-label">Photos ({photos.length - hiddenPhotoIds.size} visible)</h2>
          <div className="publication-shortcuts">
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => setHiddenPhotoIds(new Set(photos.map((p) => p.id)))}
            >
              Hide all
            </button>
            <button type="button" className="btn-secondary btn-sm" onClick={() => setHiddenPhotoIds(new Set())}>
              Show all
            </button>
          </div>
        </div>
        {photos.length === 0 && <p className="empty-state">No photos yet.</p>}
        <div className="publication-photo-grid">
          {photos.map((p) => {
            const hidden = hiddenPhotoIds.has(p.id)
            return (
              <button
                type="button"
                key={p.id}
                className={`publication-photo-item ${hidden ? 'publication-photo-hidden' : ''}`}
                onClick={() => togglePhoto(p.id)}
              >
                <img src={p.url} alt={p.note || ''} />
                <span className="publication-photo-badge">{hidden ? 'Hidden' : 'Visible'}</span>
              </button>
            )
          })}
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      <button type="button" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : trip.published ? 'Save changes' : 'Save & Publish'}
      </button>
    </div>
  )
}
