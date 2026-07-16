import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { japanTodayKey, tripDayKeys, formatDayLabel } from '../lib/days'
import { DragReorderList } from '../components/DragReorderList'
import { SwipeableRow } from '../components/SwipeableRow'
import { PlaceForm } from '../components/PlaceForm'
import { PlaceEditSheet } from '../components/PlaceEditSheet'
import { ErrorState } from '../components/ErrorState'
import { PinIcon, PlusIcon } from '../components/icons'

const STEP_LABELS = ['Dates', 'Invite', 'Budget', 'Route']

function addDays(dayKey, days) {
  const d = new Date(`${dayKey}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function CopyTripWizardPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [source, setSource] = useState(null)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(1)

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [creating, setCreating] = useState(false)

  const [newTrip, setNewTrip] = useState(null)
  const [copiedLink, setCopiedLink] = useState(false)

  const [dailyBudget, setDailyBudget] = useState('')
  const [savingBudget, setSavingBudget] = useState(false)

  const [places, setPlaces] = useState([])
  const [addSheetDay, setAddSheetDay] = useState(null)
  const [editingPlace, setEditingPlace] = useState(null)

  useEffect(() => {
    api
      .getPublicTrip(id)
      .then((t) => {
        setSource(t)
        const today = japanTodayKey()
        setStartDate(today)
        setEndDate(addDays(today, t.days.length - 1))
      })
      .catch((err) => setError(err.message))
  }, [id])

  async function handleCreateCopy(e) {
    e.preventDefault()
    setError(null)
    setCreating(true)
    try {
      const trip = await api.copyTrip(id, { startDate, endDate })
      setNewTrip(trip)
      setDailyBudget(String(trip.dailyBudget))
      const placesList = await api.listPlaces(trip.id)
      setPlaces(placesList)
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  function copyInviteLink() {
    navigator.clipboard.writeText(`${window.location.origin}/join/${newTrip.inviteToken}`)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  async function handleSaveBudget(e) {
    e.preventDefault()
    setError(null)
    setSavingBudget(true)
    try {
      const updated = await api.updateTrip(newTrip.id, { dailyBudget: Number(dailyBudget) })
      setNewTrip(updated)
      setStep(4)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingBudget(false)
    }
  }

  function handlePlaceSaved(place) {
    setPlaces((prev) => {
      const exists = prev.some((p) => p.id === place.id)
      return exists ? prev.map((p) => (p.id === place.id ? place : p)) : [...prev, place]
    })
    setAddSheetDay(null)
    setEditingPlace(null)
  }

  async function handleDeletePlace(placeId) {
    try {
      await api.deletePlace(newTrip.id, placeId)
      setPlaces((prev) => prev.filter((p) => p.id !== placeId))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleReorderPlaces(day, reordered) {
    setPlaces((prev) => [...prev.filter((p) => p.day !== day), ...reordered])
    try {
      await api.reorderPlaces(newTrip.id, day, reordered.map((p) => p.id))
    } catch (err) {
      setError(err.message)
    }
  }

  function retryLoad() {
    setError(null)
    setSource(null)
    api
      .getPublicTrip(id)
      .then((t) => {
        setSource(t)
        const today = japanTodayKey()
        setStartDate(today)
        setEndDate(addDays(today, t.days.length - 1))
      })
      .catch((err) => setError(err.message))
  }

  if (error && !source) return <ErrorState message={error} onRetry={retryLoad} />
  if (!source) return <p className="loading-state">Loading...</p>

  return (
    <div>
      <h1>Copy trip</h1>
      <ol className="wizard-steps" aria-label={`Step ${step} of 4`}>
        {STEP_LABELS.map((label, i) => {
          const n = i + 1
          const state = n < step ? 'done' : n === step ? 'current' : 'upcoming'
          return (
            <li key={label} className={`wizard-step wizard-step-${state}`}>
              <span className="wizard-step-dot">{n}</span>
              <span className="wizard-step-name">{label}</span>
            </li>
          )
        })}
      </ol>
      {error && <p className="error">{error}</p>}

      {step === 1 && (
        <form className="card" onSubmit={handleCreateCopy}>
          <h2 className="section-label">New dates</h2>
          <p className="trip-meta-row">
            Copying "{source.name}" ({source.days.length} day{source.days.length === 1 ? '' : 's'})
          </p>
          <label>
            Start date
            <input
              type="date"
              min={japanTodayKey()}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </label>
          <label>
            End date
            <input
              type="date"
              min={startDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={creating}>
            {creating ? 'Creating...' : 'Continue'}
          </button>
        </form>
      )}

      {step === 2 && newTrip && (
        <div className="card">
          <h2 className="section-label">Invite people</h2>
          <p>Share this link so others can join your new trip.</p>
          <button type="button" className="btn-secondary" onClick={copyInviteLink}>
            {copiedLink ? 'Link copied!' : 'Copy invite link'}
          </button>
          <button type="button" onClick={() => setStep(3)}>
            Next
          </button>
        </div>
      )}

      {step === 3 && newTrip && (
        <form className="card" onSubmit={handleSaveBudget}>
          <h2 className="section-label">Daily budget</h2>
          <input
            type="number"
            placeholder="Daily budget"
            value={dailyBudget}
            onChange={(e) => setDailyBudget(e.target.value.replace(/^0+(?=\d)/, ''))}
            required
          />
          <button type="submit" disabled={savingBudget}>
            {savingBudget ? 'Saving...' : 'Next'}
          </button>
        </form>
      )}

      {step === 4 && newTrip && (
        <div>
          <h2 className="section-label">Route</h2>
          <p className="trip-meta-row">
            Review the copied places for each day — drag to reorder, swipe to remove, or add more.
          </p>
          {tripDayKeys(newTrip).map((day) => {
            const dayPlaces = places.filter((p) => p.day === day)
            return (
              <div className="card" key={day}>
                <div className="wizard-day-header">
                  <h3>{formatDayLabel(day)}</h3>
                  <button
                    type="button"
                    className="btn-secondary btn-sm nav-inline-link"
                    onClick={() => setAddSheetDay(day)}
                  >
                    <PlusIcon size={14} /> Add place
                  </button>
                </div>
                {dayPlaces.length === 0 && <p className="empty-state">No places for this day.</p>}
                <DragReorderList
                  className="place-list"
                  items={dayPlaces}
                  onReorder={(reordered) => handleReorderPlaces(day, reordered)}
                  renderItem={(p) => (
                    <SwipeableRow
                      onEdit={() => setEditingPlace(p)}
                      onDelete={() => handleDeletePlace(p.id)}
                      deleteMessage={`Remove "${p.name}"?`}
                    >
                      <div className="place-row">
                        <span className="place-icon">
                          <PinIcon size={16} />
                        </span>
                        <div className="place-info">
                          <span className="place-name">
                            {p.name}
                            {p.address && ` — ${p.address}`}
                          </span>
                        </div>
                      </div>
                    </SwipeableRow>
                  )}
                />
              </div>
            )
          })}
          <button type="button" onClick={() => navigate(`/trips/${newTrip.id}`)}>
            Finish
          </button>
        </div>
      )}

      {addSheetDay && (
        <PlaceForm
          tripId={newTrip.id}
          day={addSheetDay}
          onSaved={handlePlaceSaved}
          onClose={() => setAddSheetDay(null)}
        />
      )}
      {editingPlace && (
        <PlaceEditSheet
          tripId={newTrip.id}
          place={editingPlace}
          onSaved={handlePlaceSaved}
          onClose={() => setEditingPlace(null)}
        />
      )}
    </div>
  )
}
