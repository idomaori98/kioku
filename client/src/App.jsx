import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { HomePage } from './pages/HomePage'
import { TripPage } from './pages/TripPage'
import { JoinPage } from './pages/JoinPage'
import { ProfilePage } from './pages/ProfilePage'
import { RecapPage } from './pages/RecapPage'
import { SearchPage } from './pages/SearchPage'
import { MemberActivityPage } from './pages/MemberActivityPage'
import { ChatPage } from './pages/ChatPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="loading-state">Loading...</p>
  if (!user) {
    const redirect = encodeURIComponent(location.pathname)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }
  return children
}

function Nav() {
  const { user, logout } = useAuth()
  if (!user) return null
  return (
    <nav className="nav">
      <Link to="/">記憶 Kioku</Link>
      <span className="nav-user">
        <Link to="/profile" className="avatar-small">
          {user.photoUrl ? (
            <img src={user.photoUrl} alt={user.name} />
          ) : (
            <span>{user.name.charAt(0).toUpperCase()}</span>
          )}
        </Link>
        {user.name} · <button onClick={logout}>Log out</button>
      </span>
    </nav>
  )
}

function App() {
  return (
    <div className="app">
      <Nav />
      <main>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/join/:token" element={<JoinPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/:id"
            element={
              <ProtectedRoute>
                <TripPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/:id/recap"
            element={
              <ProtectedRoute>
                <RecapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/:id/search"
            element={
              <ProtectedRoute>
                <SearchPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/:id/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/:id/members/:userId/activity"
            element={
              <ProtectedRoute>
                <MemberActivityPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
