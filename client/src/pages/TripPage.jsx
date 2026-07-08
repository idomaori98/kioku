import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

export function TripPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [trip, setTrip] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.getTrip(id).then(setTrip).catch((err) => setError(err.message))
    const interval = setInterval(() => {
      api.getTrip(id).then(setTrip).catch(() => {})
    }, 4000)
    return () => clearInterval(interval)
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

  if (error) return <p className="error">{error}</p>
  if (!trip) return <p>Loading...</p>

  const me = trip.members.find((m) => m.user.id === user?.id)
  const isAdmin = me?.role === 'admin'

  return (
    <div>
      <h1>{trip.name}</h1>
      <p>
        {new Date(trip.startDate).toLocaleDateString()} –{' '}
        {new Date(trip.endDate).toLocaleDateString()}
      </p>
      <p>
        Daily budget: {trip.dailyBudget} {trip.homeCurrency}
      </p>

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
    </div>
  )
}
