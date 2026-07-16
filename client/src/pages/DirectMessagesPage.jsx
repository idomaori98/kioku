import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export function DirectMessagesPage() {
  const [conversations, setConversations] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.listConversations().then(setConversations).catch((err) => setError(err.message))
  }, [])

  if (error) return <p className="full-page-error">{error}</p>
  if (!conversations) return <p className="loading-state">Loading...</p>

  return (
    <div>
      <h1>Messages</h1>
      <p>
        <Link className="btn-secondary btn-sm" to="/friends">
          👥 Friends
        </Link>
      </p>
      {conversations.length === 0 && (
        <p className="empty-state">No conversations yet — message a friend to start one.</p>
      )}
      <ul className="friend-list">
        {conversations.map((c) => (
          <li key={c.user.id} className="friend-row">
            <Link to={`/messages/${c.user.id}`} className="conversation-link">
              <span className="friend-name">{c.user.name}</span>
              <span className="conversation-preview">{c.lastMessage}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
