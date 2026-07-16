import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { ErrorState } from '../components/ErrorState'
import { BanIcon, CompassIcon, FlagIcon, PinIcon } from '../components/icons'

const POLL_MS = 1500

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function DirectMessageThreadPage() {
  const { friendId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [friend, setFriend] = useState(null)
  const [messages, setMessages] = useState(null)
  const [error, setError] = useState(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [blocking, setBlocking] = useState(false)

  useEffect(() => {
    api
      .listFriends()
      .then((friends) => {
        const f = friends.find((x) => x.user.id === friendId)
        setFriend(f ? f.user : { id: friendId, name: 'Friend' })
      })
      .catch(() => {})
  }, [friendId])

  useEffect(() => {
    let cancelled = false
    function load() {
      api
        .listDirectMessages(friendId)
        .then((m) => {
          if (!cancelled) setMessages(m)
        })
        .catch((err) => {
          if (!cancelled) setError(err.message)
        })
    }
    load()
    const interval = setInterval(load, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [friendId])

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    try {
      const message = await api.sendDirectMessage(friendId, { text })
      setMessages((prev) => [...prev, message])
      setText('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  async function handleReport() {
    try {
      await api.sendReport({ targetType: 'user', targetId: friendId, reason: reportReason })
      setReporting(false)
      setReportReason('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleBlock() {
    setBlocking(true)
    try {
      await api.blockUser(friendId)
      navigate('/friends')
    } catch (err) {
      setError(err.message)
      setBlocking(false)
    }
  }

  function retry() {
    setError(null)
    setMessages(null)
    api
      .listDirectMessages(friendId)
      .then(setMessages)
      .catch((err) => setError(err.message))
  }

  if (error && !messages) return <ErrorState message={error} onRetry={retry} />
  if (!messages) return <p className="loading-state">Loading...</p>

  return (
    <div className="chat-page">
      <h1>{friend?.name || 'Messages'}</h1>
      <div className="public-trip-actions">
        <Link className="btn-secondary btn-sm" to="/messages">
          ← All messages
        </Link>
        <button type="button" className="btn-secondary btn-sm nav-inline-link" onClick={() => setReporting(true)}>
          <FlagIcon size={15} /> Report
        </button>
        <button
          type="button"
          className="btn-secondary btn-sm btn-danger-outline nav-inline-link"
          onClick={handleBlock}
          disabled={blocking}
        >
          <BanIcon size={15} /> Block
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && <p className="empty-state">Say hi!</p>}
        {messages.map((m) => {
          const mine = m.senderId === user?.id
          return (
            <div key={m.id} className={`chat-message ${mine ? 'chat-message-mine' : ''}`}>
              <div className="chat-bubble">
                {m.sharedTrip ? (
                  <Link to={`/trips/${m.sharedTrip.id}/public`} className="discover-card dm-shared-trip-card">
                    <div className="discover-card-cover">
                      {m.sharedTrip.coverPhotoUrl ? (
                        <img src={m.sharedTrip.coverPhotoUrl} alt="" />
                      ) : (
                        <CompassIcon size={24} />
                      )}
                    </div>
                    <div className="discover-card-body">
                      <h3 className="discover-card-name">{m.sharedTrip.name}</h3>
                      {m.sharedTrip.destination && (
                        <p className="discover-card-destination">
                          <PinIcon /> {m.sharedTrip.destination}
                        </p>
                      )}
                    </div>
                  </Link>
                ) : (
                  <span>{m.text}</span>
                )}
              </div>
              <span className="chat-message-time">{formatTime(m.createdAt)}</span>
            </div>
          )
        })}
      </div>

      <form className="chat-composer" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" disabled={sending || !text.trim()}>
          Send
        </button>
      </form>

      {reporting && (
        <div className="confirm-backdrop" onClick={() => setReporting(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <p>Report {friend?.name}?</p>
            <textarea
              className="report-reason"
              placeholder="Reason (optional)"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
            <button type="button" onClick={handleReport}>
              Submit report
            </button>
            <button type="button" className="sheet-cancel" onClick={() => setReporting(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
