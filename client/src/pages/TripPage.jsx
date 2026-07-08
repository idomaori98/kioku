import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { dayKeyFromDate, formatDayLabel, japanTodayKey, tripDayKeys } from '../lib/days'
import { AddSheet } from '../components/AddSheet'
import { ExpenseForm, CATEGORIES } from '../components/ExpenseForm'
import { BudgetBar } from '../components/BudgetBar'

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

  const [selectedDay, setSelectedDay] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [allExpenses, setAllExpenses] = useState([])
  const [dayNote, setDayNote] = useState('')
  const [sheet, setSheet] = useState(null) // null | 'add' | 'expense'
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
    }
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
    if (option === 'expense') {
      setSheet('expense')
      return
    }
    setSheet(null)
    setPlaceholderMsg(option === 'photo' ? 'Photos arrive in M3' : 'Places arrive in M4')
    setTimeout(() => setPlaceholderMsg(null), 2500)
  }

  function handleExpenseSaved(expense) {
    setExpenses((prev) => [...prev, expense])
    setAllExpenses((prev) => [...prev, expense])
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
      <p>
        {new Date(trip.startDate).toLocaleDateString()} –{' '}
        {new Date(trip.endDate).toLocaleDateString()}
      </p>
      <p>
        Daily budget: ¥{trip.dailyBudget.toLocaleString()}
      </p>
      <p>{trip.tripType === 'family' ? 'Family trip · one shared pot' : 'Shared trip · tracks who paid'}</p>

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
        <button disabled={dayIndex <= 0} onClick={() => setSelectedDay(days[dayIndex - 1])}>
          ← Prev
        </button>
        <h2>
          {formatDayLabel(selectedDay)} {selectedDay === today && '· Today'}
        </h2>
        <button
          disabled={dayIndex >= days.length - 1}
          onClick={() => setSelectedDay(days[dayIndex + 1])}
        >
          Next →
        </button>
      </div>

      <textarea
        className="day-note"
        placeholder="Add a note about today..."
        value={dayNote}
        onChange={(e) => setDayNote(e.target.value)}
        onBlur={handleSaveNote}
      />

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
    </div>
  )
}
