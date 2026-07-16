import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { BellIcon } from '../components/icons'

function notificationText(n) {
  switch (n.type) {
    case 'friend_request':
      return 'sent you a friend request'
    case 'friend_accept':
      return 'accepted your friend request'
    case 'comment':
      return `commented on ${n.tripName || 'your trip'}`
    case 'like':
      return `liked ${n.tripName || 'your trip'}`
    case 'dm':
      return 'sent you a message'
    case 'trip_copied':
      return `copied ${n.tripName || 'your trip'} as a template`
    default:
      return ''
  }
}

function notificationTarget(n) {
  switch (n.type) {
    case 'friend_request':
    case 'friend_accept':
      return '/friends'
    case 'dm':
      return n.actor ? `/messages/${n.actor.id}` : '/messages'
    case 'comment':
    case 'like':
    case 'trip_copied':
      return n.tripId ? `/trips/${n.tripId}/public` : '/'
    default:
      return '/'
  }
}

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .listNotifications()
      .then((items) => {
        setNotifications(items)
        if (items.some((n) => !n.read)) {
          api.markNotificationsRead().catch(() => {})
        }
      })
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div>
      <header className="discover-head">
        <h1>Notifications</h1>
      </header>
      {error && <p className="error">{error}</p>}

      {!notifications ? (
        <>
          <div className="skeleton-block notification-skeleton" aria-hidden="true" />
          <div className="skeleton-block notification-skeleton" aria-hidden="true" />
          <div className="skeleton-block notification-skeleton" aria-hidden="true" />
        </>
      ) : notifications.length === 0 ? (
        <div className="notifications-empty">
          <BellIcon size={36} />
          <p>Nothing yet. When someone likes, comments on, or copies one of your trips — or sends you a friend request or message — it shows up here.</p>
        </div>
      ) : (
        <ul className="notification-list">
          {notifications.map((n) => (
            <li key={n.id}>
              <Link
                to={notificationTarget(n)}
                className={`notification-row ${n.read ? '' : 'notification-row-unread'}`}
              >
                <span className="avatar-small">
                  {n.actor?.photoUrl ? (
                    <img src={n.actor.photoUrl} alt="" />
                  ) : (
                    <span>{(n.actor?.name || '?').charAt(0).toUpperCase()}</span>
                  )}
                </span>
                <span className="notification-body">
                  <span className="notification-text">
                    <strong>{n.actor?.name || 'Someone'}</strong> {notificationText(n)}
                  </span>
                  <span className="notification-time">{timeAgo(n.createdAt)}</span>
                </span>
                {!n.read && <span className="notification-dot" aria-hidden="true" />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
