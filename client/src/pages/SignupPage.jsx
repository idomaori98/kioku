import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { GoogleButton } from '../components/GoogleButton'

export function SignupPage() {
  const [name, setName] = useState('')
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
      const result = await api.signup({ name, email, password })
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
      <h1>Sign up</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min. 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">Sign up</button>
      </form>
      <div className="divider">or</div>
      <GoogleButton onToken={handleGoogleToken} />
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  )
}
