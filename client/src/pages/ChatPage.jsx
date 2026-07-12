import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { MentionInput } from '../components/MentionInput'
import { MessageText } from '../components/MessageText'
import { MentionDetailSheet } from '../components/MentionDetailSheet'
import { buildMentionCandidates, serializeForSend } from '../lib/mentions'

const POLL_MS = 1500

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function ChatPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [trip, setTrip] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [places, setPlaces] = useState([])
  const [photos, setPhotos] = useState([])
  const [messages, setMessages] = useState(null)
  const [error, setError] = useState(null)
  const [sendError, setSendError] = useState(null)
  const [sending, setSending] = useState(false)
  const [text, setText] = useState('')
  const [mentions, setMentions] = useState([])
  const [detail, setDetail] = useState(null)
  const listRef = useRef(null)

  useEffect(() => {
    Promise.all([api.getTrip(id), api.listExpenses(id), api.listPlaces(id), api.listPhotos(id)])
      .then(([t, e, p, ph]) => {
        setTrip(t)
        setExpenses(e)
        setPlaces(p)
        setPhotos(ph)
      })
      .catch((err) => setError(err.message))
  }, [id])

  useEffect(() => {
    let cancelled = false
    function load() {
      api.listMessages(id).then((m) => {
        if (!cancelled) setMessages(m)
      }).catch((err) => {
        if (!cancelled) setError(err.message)
      })
    }
    load()
    const interval = setInterval(load, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [id])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  if (error) return <p className="full-page-error">{error}</p>
  if (!trip || !messages) return <p className="loading-state">Loading...</p>

  const isEnded = !!trip.endedAt
  const candidates = buildMentionCandidates({ members: trip.members, places, expenses, photos })

  function resolveMention(type, mentionId) {
    if (type === 'member') {
      const m = trip.members.find((mm) => mm.user.id === mentionId)
      if (!m) return null
      return { label: m.user.name, role: m.role, joinedAt: m.joinedAt }
    }
    if (type === 'place') {
      const p = places.find((pp) => pp.id === mentionId)
      if (!p) return null
      return {
        label: p.name,
        address: p.address,
        day: p.day,
        addedByName: p.addedBy.name,
        createdAt: p.createdAt,
      }
    }
    if (type === 'expense') {
      const e = expenses.find((ee) => ee.id === mentionId)
      if (!e) return null
      return {
        label: e.name,
        amountYen: e.amountYen,
        amountHome: e.amountHome,
        homeCurrency: e.homeCurrency,
        day: e.day,
        paidByName: e.paidBy?.name,
        addedByName: e.addedBy?.name || e.paidBy?.name,
        createdAt: e.createdAt,
      }
    }
    if (type === 'photo') {
      const p = photos.find((pp) => pp.id === mentionId)
      if (!p) return null
      return {
        label: p.note || `Photo — ${p.day}`,
        note: p.note,
        url: p.url,
        day: p.day,
        addedByName: p.addedBy.name,
        createdAt: p.createdAt,
      }
    }
    return null
  }

  async function handleSend() {
    const raw = serializeForSend(text, mentions).trim()
    if (!raw) return
    setSending(true)
    setSendError(null)
    try {
      const message = await api.sendMessage(id, raw)
      setMessages((prev) => [...prev, message])
      setText('')
      setMentions([])
    } catch (err) {
      setSendError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="chat-page">
      <h1>{trip.name} — Chat</h1>
      <p>
        <Link className="btn-secondary btn-sm" to={`/trips/${id}`}>
          ← Back to trip
        </Link>
      </p>

      <div className="chat-messages" ref={listRef}>
        {messages.length === 0 && <p className="empty-state">No messages yet — say hi!</p>}
        {messages.map((m) => {
          const mine = m.sender.id === user?.id
          return (
            <div key={m.id} className={`chat-message ${mine ? 'chat-message-mine' : ''}`}>
              {!mine && <span className="chat-message-sender">{m.sender.name}</span>}
              <div className="chat-bubble">
                <MessageText
                  text={m.text}
                  resolveMention={resolveMention}
                  onMentionClick={(type, item) => setDetail({ type, item })}
                />
              </div>
              <span className="chat-message-time">{formatTime(m.createdAt)}</span>
            </div>
          )
        })}
      </div>

      {sendError && <p className="error">{sendError}</p>}

      {isEnded ? (
        <p className="empty-state">This trip has ended — chat is read-only.</p>
      ) : (
        <div className="chat-composer">
          <MentionInput
            text={text}
            mentions={mentions}
            candidates={candidates}
            onChange={(t, m) => {
              setText(t)
              setMentions(m)
            }}
            onSubmit={handleSend}
            disabled={sending}
            placeholder="Message... use @ to mention"
          />
          <button type="button" onClick={handleSend} disabled={sending || !text.trim()}>
            Send
          </button>
        </div>
      )}

      {detail && (
        <MentionDetailSheet type={detail.type} item={detail.item} onClose={() => setDetail(null)} />
      )}
    </div>
  )
}
