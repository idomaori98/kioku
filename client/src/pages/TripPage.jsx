import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { dayKeyFromDate, formatDayLabel, japanTodayKey, tripDayKeys } from '../lib/days'
import { AddSheet } from '../components/AddSheet'
import { ExpenseForm, CATEGORIES } from '../components/ExpenseForm'
import { BudgetBar } from '../components/BudgetBar'
import { PhotoPicker } from '../components/PhotoPicker'

const PHOTO_PREVIEW_COUNT = 5

const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]))

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
  const [dayNote, setDayNote] = useState('')
  const [sheet, setSheet] = useState(null) // null | 'add' | 'expense' | 'photo'
  const [placeholderMsg, setPlaceholderMsg] = useState(null)

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
    if (option === 'expense' || option === 'photo') {
      setSheet(option)
      return
    }
    setSheet(null)
    setPlaceholderMsg('Places arrive in M4')
    setTimeout(() => setPlaceholderMsg(null), 2500)
  }

  function handleExpenseSaved(expense) {
    setExpenses((prev) => [...prev, expense])
    setAllExpenses((prev) => [...prev, expense])
    setSheet(null)
  }

  function handlePhotosSaved(newPhotos) {
    setPhotos((prev) => [...prev, ...newPhotos])
    setSheet(null)
  }

  if (error) return <p className="error">{error}</p>
  if (!trip || !selectedDay) return <p>Loading...</p>

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
          <button type="submit">Save</button>
          <button type="button" className="sheet-cancel" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <>
          <p>
            {new Date(trip.startDate).toLocaleDateString()} –{' '}
            {new Date(trip.endDate).toLocaleDateString()}
          </p>
          <p>Daily budget: ¥{trip.dailyBudget.toLocaleString()}</p>
          <p>{trip.tripType === 'family' ? 'Family trip · one shared pot' : 'Shared trip · tracks who paid'}</p>
          {isAdmin && <button onClick={startEdit}>Edit dates &amp; budget</button>}
        </>
      )}

      <h2>Invite link</h2>
      <button onClick={copyInviteLink}>{copied ? 'Copied!' : 'Copy invite link'}</button>

      <h2>Members</h2>
      <ul className="member-list">
        {trip.members.map((m) => (
          <li key={m.user.id}>
            {m.user.name} ({m.user.email}) — {m.role}
            {isAdmin && m.role !== 'admin' && (
              <button onClick={() => handleGrantAdmin(m.user.id)}>Make admin</button>
            )}
          </li>
        ))}
      </ul>

      <hr />

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

      <h2>Photos</h2>
      {photos.length === 0 && <p>No photos yet for this day.</p>}
      <div className="photo-grid">
        {(showAllPhotos ? photos : photos.slice(0, PHOTO_PREVIEW_COUNT)).map((p) => (
          <div key={p.id} className="photo-grid-item">
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

      <div className="spending-card">
        <p>
          Today: ¥{dailyYen.toLocaleString()} ({dailyHome.toFixed(2)} {trip.homeCurrency})
        </p>
        <BudgetBar spent={dailyYen} budget={trip.dailyBudget} />
        <p>
          Trip total: ¥{tripYen.toLocaleString()} ({tripHome.toFixed(2)} {trip.homeCurrency})
        </p>
      </div>

      <h2>Expenses</h2>
      <ul className="expense-list">
        {expenses.length === 0 && <p>Nothing logged yet for this day.</p>}
        {expenses.map((e) => (
          <li key={e.id}>
            {CATEGORY_LABEL[e.category]} {e.name} — ¥{e.amountYen.toLocaleString()} (
            {e.amountHome.toFixed(2)} {e.homeCurrency})
            {trip.tripType !== 'family' && (
              <>
                <br />
                <small>
                  paid by {e.paidBy.name} · added by {e.addedBy.name}
                </small>
              </>
            )}
          </li>
        ))}
      </ul>

      {placeholderMsg && <p className="placeholder-msg">{placeholderMsg}</p>}

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
          onSaved={handleExpenseSaved}
          onClose={() => setSheet(null)}
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
    </div>
  )
}
