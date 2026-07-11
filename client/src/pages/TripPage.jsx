import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { dayKeyFromDate, formatDayLabel, japanTodayKey, tripDayKeys } from '../lib/days'
import { AddSheet } from '../components/AddSheet'
import { ExpenseForm, CATEGORIES } from '../components/ExpenseForm'
import { BudgetBar } from '../components/BudgetBar'
import { PhotoPicker } from '../components/PhotoPicker'
import { PlaceForm } from '../components/PlaceForm'
import { PlaceEditSheet } from '../components/PlaceEditSheet'
import { PlacesMap } from '../components/PlacesMap'
import { SwipeableRow } from '../components/SwipeableRow'
import { PhotoLightbox } from '../components/PhotoLightbox'

const PHOTO_PREVIEW_COUNT = 5

const CATEGORY_EMOJI = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.emoji]))

function sumYen(expenses) {
  return expenses.reduce((sum, e) => sum + e.amountYen, 0)
}

function sumHome(expenses) {
  return expenses.reduce((sum, e) => sum + e.amountHome, 0)
}

export function TripPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [trip, setTrip] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState(null)

  const [selectedDay, setSelectedDay] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [allExpenses, setAllExpenses] = useState([])
  const [photos, setPhotos] = useState([])
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const [places, setPlaces] = useState([])
  const [dayNote, setDayNote] = useState('')
  const [sheet, setSheet] = useState(null) // null | 'add' | 'expense' | 'photo' | 'place' | 'edit-place'
  const [editingExpense, setEditingExpense] = useState(null)
  const [editingPlace, setEditingPlace] = useState(null)
  const [focusRequest, setFocusRequest] = useState(null)
  const [lightboxPhoto, setLightboxPhoto] = useState(null)
  const focusNonceRef = useRef(0)

  function focusPlace(placeId) {
    focusNonceRef.current += 1
    setFocusRequest({ id: placeId, nonce: focusNonceRef.current })
  }

  useEffect(() => {
    let cancelled = false
    function load() {
      api.getTrip(id).then((t) => {
        if (!cancelled) setTrip(t)
      }).catch((err) => setError(err.message))
    }
    load()
    const interval = setInterval(load, 4000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [id])

  useEffect(() => {
    if (!trip || selectedDay) return
    const days = tripDayKeys(trip)
    const today = japanTodayKey()
    if (days.includes(today)) setSelectedDay(today)
    else if (today < days[0]) setSelectedDay(days[0])
    else setSelectedDay(days[days.length - 1])
  }, [trip, selectedDay])

  useEffect(() => {
    if (!id || !selectedDay) return
    let cancelled = false
    function load() {
      api.listExpenses(id, selectedDay).then((e) => {
        if (!cancelled) setExpenses(e)
      }).catch(() => {})
      api.getDayNote(id, selectedDay).then((n) => {
        if (!cancelled) setDayNote(n.note)
      }).catch(() => {})
      api.listPhotos(id, selectedDay).then((p) => {
        if (!cancelled) setPhotos(p)
      }).catch(() => {})
      api.listPlaces(id, selectedDay).then((p) => {
        if (!cancelled) setPlaces(p)
      }).catch(() => {})
    }
    setShowAllPhotos(false)
    load()
    const interval = setInterval(load, 4000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [id, selectedDay])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    function load() {
      api.listExpenses(id).then((e) => {
        if (!cancelled) setAllExpenses(e)
      }).catch(() => {})
    }
    load()
    const interval = setInterval(load, 4000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [id])

  async function handleGrantAdmin(userId) {
    try {
      const updated = await api.grantAdmin(id, userId)
      setTrip(updated)
    } catch (err) {
      setError(err.message)
    }
  }

  function startEdit() {
    setEditForm({
      startDate: dayKeyFromDate(trip.startDate),
      endDate: dayKeyFromDate(trip.endDate),
      dailyBudget: String(trip.dailyBudget),
      homeCurrency: trip.homeCurrency,
      tripType: trip.tripType,
    })
    setEditing(true)
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    setError(null)
    try {
      const updated = await api.updateTrip(id, {
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        dailyBudget: Number(editForm.dailyBudget),
        homeCurrency: editForm.homeCurrency,
        tripType: editForm.tripType,
      })
      setTrip(updated)
      setEditing(false)
    } catch (err) {
      setError(err.message)
    }
  }

  function copyInviteLink() {
    const link = `${window.location.origin}/join/${trip.inviteToken}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSaveNote() {
    try {
      await api.setDayNote(id, selectedDay, dayNote)
    } catch (err) {
      setError(err.message)
    }
  }

  function handleAddSelect(option) {
    setEditingExpense(null)
    setEditingPlace(null)
    setSheet(option)
  }

  function upsert(list, item) {
    const exists = list.some((x) => x.id === item.id)
    return exists ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]
  }

  function handleExpenseSaved(expense) {
    setExpenses((prev) => upsert(prev, expense))
    setAllExpenses((prev) => upsert(prev, expense))
    setSheet(null)
    setEditingExpense(null)
  }

  function handleExpenseDeleted(expenseId) {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId))
    setAllExpenses((prev) => prev.filter((e) => e.id !== expenseId))
    setSheet(null)
    setEditingExpense(null)
  }

  function handlePhotosSaved(newPhotos) {
    setPhotos((prev) => [...prev, ...newPhotos])
    setSheet(null)
  }

  function handlePlaceSaved(place) {
    setPlaces((prev) => upsert(prev, place))
    setSheet(null)
    setEditingPlace(null)
  }

  function handlePlaceDeleted(placeId) {
    setPlaces((prev) => prev.filter((p) => p.id !== placeId))
    setSheet(null)
    setEditingPlace(null)
  }

  async function handleQuickDeleteExpense(expenseId) {
    try {
      await api.deleteExpense(id, expenseId)
      handleExpenseDeleted(expenseId)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleQuickDeletePlace(placeId) {
    try {
      await api.deletePlace(id, placeId)
      handlePlaceDeleted(placeId)
    } catch (err) {
      setError(err.message)
    }
  }

  if (error) return <p className="full-page-error">{error}</p>
  if (!trip || !selectedDay) return <p className="loading-state">Loading...</p>

  const me = trip.members.find((m) => m.user.id === user?.id)
  const isAdmin = me?.role === 'admin'
  const days = tripDayKeys(trip)
  const dayIndex = days.indexOf(selectedDay)
  const today = japanTodayKey()

  const dailyYen = sumYen(expenses)
  const dailyHome = sumHome(expenses)
  const tripYen = sumYen(allExpenses)
  const tripHome = sumHome(allExpenses)

  return (
    <div>
      <h1>{trip.name}</h1>

      <div className="card trip-meta-card">
        {editing ? (
          <form onSubmit={handleSaveEdit}>
            <label>
              Start date
              <input
                type="date"
                value={editForm.startDate}
                onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                required
              />
            </label>
            <label>
              End date
              <input
                type="date"
                min={editForm.startDate}
                value={editForm.endDate}
                onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                required
              />
            </label>
            <input
              type="number"
              placeholder="Daily budget"
              value={editForm.dailyBudget}
              onChange={(e) =>
                setEditForm({ ...editForm, dailyBudget: e.target.value.replace(/^0+(?=\d)/, '') })
              }
              required
            />
            <input
              type="text"
              placeholder="Home currency (e.g. USD)"
              value={editForm.homeCurrency}
              onChange={(e) => setEditForm({ ...editForm, homeCurrency: e.target.value })}
              required
            />
            <div className="trip-type-choice">
              <label>
                <input
                  type="radio"
                  name="editTripType"
                  value="shared"
                  checked={editForm.tripType === 'shared'}
                  onChange={(e) => setEditForm({ ...editForm, tripType: e.target.value })}
                />
                Shared trip — track who paid for each expense
              </label>
              <label>
                <input
                  type="radio"
                  name="editTripType"
                  value="family"
                  checked={editForm.tripType === 'family'}
                  onChange={(e) => setEditForm({ ...editForm, tripType: e.target.value })}
                />
                Family trip — one pot, just log the spending
              </label>
            </div>
            <button type="submit">Save</button>
            <button type="button" className="sheet-cancel" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </form>
        ) : (
          <>
            <p className="trip-meta-row">
              {new Date(trip.startDate).toLocaleDateString()} –{' '}
              {new Date(trip.endDate).toLocaleDateString()}
              <span className="trip-meta-sep">·</span>¥{trip.dailyBudget.toLocaleString()}/day
            </p>
            <p className="trip-type-tag">
              {trip.tripType === 'family' ? 'Family trip · one shared pot' : 'Shared trip · tracks who paid'}
              {' · '}
              {trip.homeCurrency}
            </p>
            <div className="trip-meta-actions">
              {isAdmin && (
                <button className="btn-secondary btn-sm" onClick={startEdit}>
                  Edit trip settings
                </button>
              )}
              <Link className="btn-secondary btn-sm" to={`/trips/${id}/recap`}>
                View recap
              </Link>
              <Link className="btn-secondary btn-sm" to={`/trips/${id}/search`}>
                🔍 Search
              </Link>
            </div>
          </>
        )}
      </div>

      <details className="trip-settings">
        <summary>Trip settings</summary>
        <div className="trip-settings-body">
          <h3>Invite link</h3>
          <button className="btn-secondary" onClick={copyInviteLink}>
            {copied ? 'Copied!' : 'Copy invite link'}
          </button>

          <h3>Members</h3>
          <ul className="member-list">
            {trip.members.map((m) => (
              <li key={m.user.id}>
                {m.user.name} ({m.user.email}) — {m.role}
                {isAdmin && m.role !== 'admin' && (
                  <button className="btn-secondary btn-sm" onClick={() => handleGrantAdmin(m.user.id)}>
                    Make admin
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </details>

      <div className="day-nav">
        {dayIndex > 0 ? (
          <button onClick={() => setSelectedDay(days[dayIndex - 1])}>← Prev</button>
        ) : (
          <span />
        )}
        <h2>
          {formatDayLabel(selectedDay)} {selectedDay === today && '· Today'}
        </h2>
        {dayIndex < days.length - 1 ? (
          <button onClick={() => setSelectedDay(days[dayIndex + 1])}>Next →</button>
        ) : (
          <span />
        )}
      </div>

      <textarea
        className="day-note"
        placeholder="Add a note about today..."
        value={dayNote}
        onChange={(e) => setDayNote(e.target.value)}
        onBlur={handleSaveNote}
      />

      <div className="card">
        <h2 className="section-label">Photos</h2>
        {photos.length === 0 && <p className="empty-state">No photos yet for this day.</p>}
        <div className="photo-grid">
          {(showAllPhotos ? photos : photos.slice(0, PHOTO_PREVIEW_COUNT)).map((p) => (
            <div
              key={p.id}
              className="photo-grid-item"
              onClick={() => setLightboxPhoto(p)}
              role="button"
              tabIndex={0}
            >
              <img src={p.url} alt={p.note || ''} />
            </div>
          ))}
          {!showAllPhotos && photos.length > PHOTO_PREVIEW_COUNT && (
            <div
              className="photo-grid-item"
              onClick={() => setShowAllPhotos(true)}
              role="button"
              tabIndex={0}
            >
              <img src={photos[PHOTO_PREVIEW_COUNT].url} alt="" />
              <div className="photo-grid-more">+{photos.length - PHOTO_PREVIEW_COUNT}</div>
            </div>
          )}
        </div>
      </div>

      <div className="card spending-card">
        <p>
          Today: ¥{dailyYen.toLocaleString()} ({dailyHome.toFixed(2)} {trip.homeCurrency})
        </p>
        <BudgetBar spent={dailyYen} budget={trip.dailyBudget} />
        <p>
          Trip total: ¥{tripYen.toLocaleString()} ({tripHome.toFixed(2)} {trip.homeCurrency})
        </p>
      </div>

      <div className="card">
        <h2 className="section-label">Expenses</h2>
        {expenses.length === 0 && <p className="empty-state">Nothing logged yet for this day.</p>}
        <ul className="expense-list">
          {expenses.map((e) => (
            <li key={e.id}>
              <SwipeableRow
                onEdit={() => {
                  setEditingExpense(e)
                  setSheet('expense')
                }}
                onDelete={() => handleQuickDeleteExpense(e.id)}
                deleteMessage={`Delete "${e.name}"?`}
              >
                <div className="expense-row">
                  <span className={`expense-icon cat-${e.category}`}>{CATEGORY_EMOJI[e.category]}</span>
                  <div className="expense-info">
                    <span className="expense-name">{e.name}</span>
                    {trip.tripType !== 'family' && (
                      <span className="expense-meta">
                        paid by {e.paidBy.name} · added by {e.addedBy.name}
                      </span>
                    )}
                  </div>
                  <div className="expense-amount">
                    <span className="expense-amount-yen">¥{e.amountYen.toLocaleString()}</span>
                    <span className="expense-amount-home">
                      {e.amountHome.toFixed(2)} {e.homeCurrency}
                    </span>
                  </div>
                </div>
              </SwipeableRow>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2 className="section-label">Places</h2>
        <PlacesMap places={places} focusRequest={focusRequest} />
        {places.length === 0 && <p className="empty-state">No places logged yet for this day.</p>}
        <ul className="place-list">
          {places.map((p) => (
            <li key={p.id}>
              <SwipeableRow
                onEdit={() => {
                  setEditingPlace(p)
                  setSheet('edit-place')
                }}
                onDelete={() => handleQuickDeletePlace(p.id)}
                deleteMessage={`Delete "${p.name}"?`}
              >
                <div
                  className="place-row"
                  onClick={() => focusPlace(p.id)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="place-icon">📍</span>
                  <div className="place-info">
                    <span className="place-name">
                      {p.name}
                      {p.address && ` — ${p.address}`}
                    </span>
                    <span className="place-meta">added by {p.addedBy.name}</span>
                  </div>
                </div>
              </SwipeableRow>
            </li>
          ))}
        </ul>
      </div>

      <button className="fab" onClick={() => setSheet('add')}>
        +
      </button>

      {sheet === 'add' && <AddSheet onSelect={handleAddSelect} onClose={() => setSheet(null)} />}
      {sheet === 'expense' && (
        <ExpenseForm
          tripId={id}
          day={selectedDay}
          tripType={trip.tripType}
          members={trip.members}
          currentUserId={user.id}
          expense={editingExpense}
          onSaved={handleExpenseSaved}
          onClose={() => {
            setSheet(null)
            setEditingExpense(null)
          }}
        />
      )}
      {sheet === 'photo' && (
        <PhotoPicker
          tripId={id}
          day={selectedDay}
          onSaved={handlePhotosSaved}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'place' && (
        <PlaceForm
          tripId={id}
          day={selectedDay}
          onSaved={handlePlaceSaved}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'edit-place' && editingPlace && (
        <PlaceEditSheet
          tripId={id}
          place={editingPlace}
          onSaved={handlePlaceSaved}
          onClose={() => {
            setSheet(null)
            setEditingPlace(null)
          }}
        />
      )}
      {lightboxPhoto && (
        <PhotoLightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />
      )}
    </div>
  )
}
