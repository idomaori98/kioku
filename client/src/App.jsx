import { useEffect, useState } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { api } from './api'
import { BellIcon, BookmarkIcon, CompassIcon, MessageCircleIcon, UsersIcon } from './components/icons'
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
import { NotificationsPage } from './pages/NotificationsPage'

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
  const location = useLocation()
  const [unread, setUnread] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const refresh = () => {
      api
        .getUnreadNotificationCount()
        .then(({ count }) => {
          if (!cancelled) setUnread(count)
        })
        .catch(() => {})
      api
        .getUnreadMessageCount()
        .then(({ count }) => {
          if (!cancelled) setUnreadMessages(count)
        })
        .catch(() => {})
    }
    refresh()
    const interval = setInterval(refresh, 60000)
    window.addEventListener('kioku:badges-changed', refresh)
    return () => {
      cancelled = true
      clearInterval(interval)
      window.removeEventListener('kioku:badges-changed', refresh)
    }
  }, [user, location.pathname])

  if (!user) return null
  return (
    <nav className="nav" aria-label="Primary">
      <Link to="/" className="nav-brand">
        <span className="nav-brand-kanji">記憶</span>
        <span className="nav-brand-name">Kioku</span>
      </Link>
      <div className="nav-links">
        {NAV_ITEMS.map(({ to, label, Icon }) => {
          const badge = to === '/messages' && unreadMessages > 0
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-icon-link ${isActive ? 'nav-icon-link-active' : ''}`}
              aria-label={badge ? `${label} (${unreadMessages} unread)` : undefined}
            >
              <span className="nav-icon-wrap">
                <Icon size={20} />
                {badge && <span className="nav-icon-badge" aria-hidden="true" />}
              </span>
              <span>{label}</span>
            </NavLink>
          )
        })}
        <NavLink
          to="/notifications"
          className={({ isActive }) => `nav-bell ${isActive ? 'nav-bell-active' : ''}`}
          aria-label={unread > 0 ? `Notifications (${unread} unread)` : 'Notifications'}
        >
          <BellIcon />
          {unread > 0 && <span className="nav-bell-badge">{unread > 9 ? '9+' : unread}</span>}
        </NavLink>
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
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
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
