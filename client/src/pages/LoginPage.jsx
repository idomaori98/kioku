import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { GoogleButton } from '../components/GoogleButton'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const { onAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      const result = await api.login({ email, password })
      onAuthenticated(result)
      navigate(redirect)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleGoogleToken(idToken) {
    setError(null)
    try {
      const result = await api.loginWithGoogle(idToken)
      onAuthenticated(result)
      navigate(redirect)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="auth-page">
      <h1>Log in</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">Log in</button>
      </form>
      <div className="divider">or</div>
      <GoogleButton onToken={handleGoogleToken} />
      <p>
        No account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  )
}
