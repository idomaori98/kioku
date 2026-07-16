import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { BellIcon } from '../components/icons'
import { timeAgo } from '../lib/timeAgo'

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
    case 'comment':
    case 'like':
    case 'trip_copied':
      return n.tripId ? `/trips/${n.tripId}/public` : '/'
    default:
      return '/'
  }
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState(null)
  const [error, setError] = useState(null)

  function load() {
    setError(null)
    setNotifications(null)
    api
      .listNotifications()
      .then((items) => {
        setNotifications(items)
        if (items.some((n) => !n.read)) {
          api.markNotificationsRead().catch(() => {})
        }
      })
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div>
      <header className="discover-head">
        <h1>Notifications</h1>
      </header>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !notifications ? (
        <>
          <div className="skeleton-block notification-skeleton" aria-hidden="true" />
          <div className="skeleton-block notification-skeleton" aria-hidden="true" />
          <div className="skeleton-block notification-skeleton" aria-hidden="true" />
        </>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={BellIcon}
          title="No notifications yet"
          message="When someone likes, comments on, or copies your trip — or sends a friend request or message — it shows up here."
        />
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
