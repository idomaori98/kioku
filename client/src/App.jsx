import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { BookmarkIcon, CompassIcon, MessageCircleIcon, UsersIcon } from './components/icons'
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
import { BalancesPage } from './pages/BalancesPage'
import { PublicationEditPage } from './pages/PublicationEditPage'
import { PublicTripPage } from './pages/PublicTripPage'
import { DiscoverPage } from './pages/DiscoverPage'
import { CopyTripWizardPage } from './pages/CopyTripWizardPage'
import { FriendsPage } from './pages/FriendsPage'
import { DirectMessagesPage } from './pages/DirectMessagesPage'
import { DirectMessageThreadPage } from './pages/DirectMessageThreadPage'
import { FavoritesPage } from './pages/FavoritesPage'

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

const NAV_ITEMS = [
  { to: '/discover', label: 'Discover', Icon: CompassIcon },
  { to: '/friends', label: 'Friends', Icon: UsersIcon },
  { to: '/messages', label: 'Messages', Icon: MessageCircleIcon },
  { to: '/favorites', label: 'Favorites', Icon: BookmarkIcon },
]

function Nav() {
  const { user } = useAuth()
  if (!user) return null
  return (
    <nav className="nav" aria-label="Primary">
      <Link to="/" className="nav-brand">
        <span className="nav-brand-kanji">記憶</span>
        <span className="nav-brand-name">Kioku</span>
      </Link>
      <div className="nav-links">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-icon-link ${isActive ? 'nav-icon-link-active' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
        <Link to="/profile" className="avatar-small nav-avatar" aria-label="Your profile">
          {user.photoUrl ? (
            <img src={user.photoUrl} alt={user.name} />
          ) : (
            <span>{user.name.charAt(0).toUpperCase()}</span>
          )}
        </Link>
      </div>
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
            path="/trips/:id/balances"
            element={
              <ProtectedRoute>
                <BalancesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/:id/publication"
            element={
              <ProtectedRoute>
                <PublicationEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/:id/public"
            element={
              <ProtectedRoute>
                <PublicTripPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/discover"
            element={
              <ProtectedRoute>
                <DiscoverPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/:id/copy"
            element={
              <ProtectedRoute>
                <CopyTripWizardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/friends"
            element={
              <ProtectedRoute>
                <FriendsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <DirectMessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages/:friendId"
            element={
              <ProtectedRoute>
                <DirectMessageThreadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <FavoritesPage />
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
