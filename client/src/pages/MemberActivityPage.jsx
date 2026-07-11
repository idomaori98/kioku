import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { CATEGORIES } from '../components/ExpenseForm'

const CATEGORY_EMOJI = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.emoji]))

function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function activitySummary(item) {
  if (item.type === 'expense') {
    return `Logged an expense — ${item.name} (¥${item.amountYen.toLocaleString()})`
  }
  if (item.type === 'place') {
    return `Added a place — ${item.name}${item.address ? ` (${item.address})` : ''}`
  }
  if (item.type === 'photo') {
    return `Uploaded a photo${item.note ? ` — "${item.note}"` : ''}`
  }
  return `Wrote a day note${item.note ? ` — "${item.note}"` : ''}`
}

export function MemberActivityPage() {
  const { id, userId } = useParams()
  const [trip, setTrip] = useState(null)
  const [activity, setActivity] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([api.getTrip(id), api.getMemberActivity(id, userId)])
      .then(([t, a]) => {
        setTrip(t)
        setActivity(a)
      })
      .catch((err) => setError(err.message))
  }, [id, userId])

  if (error) return <p className="full-page-error">{error}</p>
  if (!trip || !activity) return <p className="loading-state">Loading...</p>

  const member = trip.members.find((m) => m.user.id === userId)
  const memberName = member ? member.user.name : 'Member'

  return (
    <div>
      <h1>{memberName}'s activity</h1>
      <p>
        <Link className="btn-secondary btn-sm" to={`/trips/${id}`}>
          ← Back to trip
        </Link>
      </p>

      <div className="card">
        {activity.length === 0 && <p className="empty-state">No activity yet.</p>}
        <ul className="activity-list">
          {activity.map((item, i) => (
            <li key={i} className="activity-row">
              <span className={`activity-icon activity-${item.type}`}>
                {item.type === 'expense' && CATEGORY_EMOJI[item.category]}
                {item.type === 'place' && '📍'}
                {item.type === 'photo' && '📷'}
                {item.type === 'note' && '📝'}
              </span>
              <div className="activity-info">
                <span className="activity-summary">{activitySummary(item)}</span>
                <span className="activity-meta">{formatDateTime(item.at)}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
