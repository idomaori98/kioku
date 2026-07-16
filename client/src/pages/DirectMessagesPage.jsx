import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { MessageCircleIcon, UsersIcon } from '../components/icons'
import { timeAgo } from '../lib/timeAgo'

export function DirectMessagesPage() {
  const [conversations, setConversations] = useState(null)
  const [error, setError] = useState(null)

  function load() {
    setError(null)
    setConversations(null)
    api.listConversations().then(setConversations).catch((err) => setError(err.message))
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div>
      <header className="discover-head discover-head-row">
        <h1>Messages</h1>
        <Link className="btn-secondary btn-sm nav-inline-link" to="/friends">
          <UsersIcon size={16} /> Friends
        </Link>
      </header>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !conversations ? (
        <>
          <div className="skeleton-block skeleton-row" aria-hidden="true" />
          <div className="skeleton-block skeleton-row" aria-hidden="true" />
          <div className="skeleton-block skeleton-row" aria-hidden="true" />
        </>
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={MessageCircleIcon}
          title="No conversations yet"
          message="Message a friend to start a conversation."
          actionLabel="Find friends"
          actionTo="/friends"
        />
      ) : (
        <ul className="conversation-list">
          {conversations.map((c) => (
            <li key={c.user.id}>
              <Link
                to={`/messages/${c.user.id}`}
                className={`conversation-card ${c.unreadCount > 0 ? 'conversation-card-unread' : ''}`}
              >
                <span className="conversation-avatar">
                  {c.user.photoUrl ? (
                    <img src={c.user.photoUrl} alt="" />
                  ) : (
                    <span>{c.user.name.charAt(0).toUpperCase()}</span>
                  )}
                </span>
                <span className="conversation-main">
                  <span className="conversation-top">
                    <span className="conversation-name">{c.user.name}</span>
                    {c.lastMessageAt && (
                      <span className="conversation-time">{timeAgo(c.lastMessageAt)}</span>
                    )}
                  </span>
                  <span className="conversation-bottom">
                    <span className="conversation-preview">{c.lastMessage}</span>
                    {c.unreadCount > 0 && (
                      <span className="conversation-badge" aria-label={`${c.unreadCount} unread`}>
                        {c.unreadCount > 9 ? '9+' : c.unreadCount}
                      </span>
                    )}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
