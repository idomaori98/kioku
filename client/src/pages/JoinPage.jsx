import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

export function JoinPage() {
  const { token } = useParams()
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    if (loading || !user) return
    api
      .joinTrip(token)
      .then((trip) => navigate(`/trips/${trip.id}`, { replace: true }))
      .catch((err) => setError(err.message))
  }, [loading, user, token, navigate])

  if (loading) return <p className="loading-state">Loading...</p>

  if (!user) {
    const redirect = `/join/${token}`
    return (
      <div className="auth-page">
        <h1>Join this trip</h1>
        <p>Log in or sign up to join.</p>
        <p>
          <Link to={`/login?redirect=${encodeURIComponent(redirect)}`}>Log in</Link>
          {' · '}
          <Link to={`/signup?redirect=${encodeURIComponent(redirect)}`}>Sign up</Link>
        </p>
      </div>
    )
  }

  if (error) return <p className="full-page-error">{error}</p>
  return <p className="loading-state">Joining trip...</p>
}
