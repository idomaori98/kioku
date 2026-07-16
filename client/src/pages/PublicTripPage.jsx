import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { formatDayLabel } from '../lib/days'
import { CATEGORIES } from '../components/ExpenseForm'
import { PlacesMap } from '../components/PlacesMap'
import { PhotoLightbox } from '../components/PhotoLightbox'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ErrorState } from '../components/ErrorState'
import {
  BookmarkIcon,
  ClipboardIcon,
  FlagIcon,
  HeartIcon,
  PinIcon,
  ShareIcon,
} from '../components/icons'

const CATEGORY_EMOJI = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.emoji]))

function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function PublicTripPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [trip, setTrip] = useState(null)
  const [error, setError] = useState(null)
  const [dayIndex, setDayIndex] = useState(0)
  const [focusRequest, setFocusRequest] = useState(null)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const focusNonceRef = useRef(0)

  const [comments, setComments] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [deletingComment, setDeletingComment] = useState(null)
  const [reportingComment, setReportingComment] = useState(null)
  const [reportReason, setReportReason] = useState('')

  const [showSharePicker, setShowSharePicker] = useState(false)
  const [friends, setFriends] = useState(null)
  const [sharedWith, setSharedWith] = useState(null)
  const [reportingTrip, setReportingTrip] = useState(false)
  const [tripReportReason, setTripReportReason] = useState('')

  useEffect(() => {
    api.getPublicTrip(id).then(setTrip).catch((err) => setError(err.message))
    api.listComments(id).then(setComments).catch(() => {})
  }, [id])

  function focusPlace(placeId) {
    focusNonceRef.current += 1
    setFocusRequest({ id: placeId, nonce: focusNonceRef.current })
  }

  async function toggleLike() {
    const wasLiked = trip.likedByMe
    setTrip((prev) => ({
      ...prev,
      likedByMe: !wasLiked,
      likesCount: prev.likesCount + (wasLiked ? -1 : 1),
    }))
    try {
      const result = wasLiked ? await api.unlikeTrip(id) : await api.likeTrip(id)
      setTrip((prev) => ({ ...prev, likesCount: result.likesCount, likedByMe: result.likedByMe }))
    } catch (err) {
      setError(err.message)
    }
  }

  async function toggleFavorite() {
    const wasFavorited = trip.favoritedByMe
    setTrip((prev) => ({ ...prev, favoritedByMe: !wasFavorited }))
    try {
      const result = wasFavorited ? await api.unfavoriteTrip(id) : await api.favoriteTrip(id)
      setTrip((prev) => ({ ...prev, favoritedByMe: result.favoritedByMe }))
    } catch (err) {
      setError(err.message)
    }
  }

  async function openSharePicker() {
    setShowSharePicker(true)
    setSharedWith(null)
    if (!friends) {
      try {
        const list = await api.listFriends()
        setFriends(list)
      } catch (err) {
        setError(err.message)
      }
    }
  }

  async function handleShareToFriend(friendId, friendName) {
    try {
      await api.sendDirectMessage(friendId, { sharedTripId: id })
      setSharedWith(friendName)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAddComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    setPostingComment(true)
    try {
      const comment = await api.addComment(id, commentText)
      setComments((prev) => [...prev, comment])
      setCommentText('')
    } catch (err) {
      setError(err.message)
    } finally {
      setPostingComment(false)
    }
  }

  async function handleDeleteComment() {
    try {
      await api.deleteComment(id, deletingComment.id)
      setComments((prev) => prev.filter((c) => c.id !== deletingComment.id))
      setDeletingComment(null)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleReportComment() {
    try {
      await api.sendReport({ targetType: 'comment', targetId: reportingComment.id, reason: reportReason })
      setReportingComment(null)
      setReportReason('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleBlockCommenter(userId) {
    try {
      await api.blockUser(userId)
      setComments((prev) => prev.filter((c) => c.user.id !== userId))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleReportTrip() {
    try {
      await api.sendReport({ targetType: 'trip', targetId: id, reason: tripReportReason })
      setReportingTrip(false)
      setTripReportReason('')
    } catch (err) {
      setError(err.message)
    }
  }

  function retryLoad() {
    setError(null)
    setTrip(null)
    api.getPublicTrip(id).then(setTrip).catch((err) => setError(err.message))
    api.listComments(id).then(setComments).catch(() => {})
  }

  if (error && !trip) return <ErrorState message={error} onRetry={retryLoad} />
  if (!trip) return <p className="loading-state">Loading...</p>

  const day = trip.days[dayIndex]

  return (
    <div>
      <h1>{trip.name}</h1>
      {error && <p className="error">{error}</p>}
      {trip.destination && (
        <p className="trip-destination">
          <PinIcon /> {trip.destination}
        </p>
      )}
      <p className="trip-meta-row">
        {new Date(trip.startDate).toLocaleDateString()} – {new Date(trip.endDate).toLocaleDateString()}
        <span className="trip-meta-sep">·</span>
        {trip.tripType === 'family' ? 'One-pot expenses' : 'Shared expenses'}
      </p>
      {trip.createdByName && <p className="public-byline">Published by {trip.createdByName}</p>}
      <div className="public-trip-actions">
        <button
          type="button"
          className={`discover-like ${trip.likedByMe ? 'discover-like-active' : ''}`}
          onClick={toggleLike}
          aria-pressed={trip.likedByMe}
        >
          <HeartIcon filled={trip.likedByMe} /> {trip.likesCount}
        </button>
        <button
          type="button"
          className={`discover-like ${trip.favoritedByMe ? 'discover-like-active' : ''}`}
          onClick={toggleFavorite}
          aria-pressed={trip.favoritedByMe}
        >
          <BookmarkIcon size={16} /> {trip.favoritedByMe ? 'Saved' : 'Save'}
        </button>
        <Link className="btn-secondary btn-sm nav-inline-link" to={`/trips/${id}/copy`}>
          <ClipboardIcon size={15} /> Copy this trip
        </Link>
        <button type="button" className="btn-secondary btn-sm nav-inline-link" onClick={openSharePicker}>
          <ShareIcon size={15} /> Share
        </button>
        <button type="button" className="btn-secondary btn-sm nav-inline-link" onClick={() => setReportingTrip(true)}>
          <FlagIcon size={15} /> Report
        </button>
      </div>

      <div className="recap-stats">
        <div>
          <strong>{trip.stats.days}</strong>
          <span>days</span>
        </div>
        <div>
          <strong>{trip.stats.travelers}</strong>
          <span>travelers</span>
        </div>
        <div>
          <strong>{trip.stats.photos}</strong>
          <span>photos</span>
        </div>
        <div>
          <strong>{trip.stats.places}</strong>
          <span>places</span>
        </div>
      </div>
      <p className="trip-meta-row">
        Total spend: ¥{trip.stats.spendYen.toLocaleString()} ({trip.stats.spendHome.toFixed(2)}{' '}
        {trip.homeCurrency})
      </p>

      <div className="day-nav">
        {dayIndex > 0 ? (
          <button onClick={() => setDayIndex(dayIndex - 1)}>← Prev</button>
        ) : (
          <span />
        )}
        <h2>{formatDayLabel(day.day)}</h2>
        {dayIndex < trip.days.length - 1 ? (
          <button onClick={() => setDayIndex(dayIndex + 1)}>Next →</button>
        ) : (
          <span />
        )}
      </div>

      {day.note ? (
        <p className="day-note-readonly">{day.note}</p>
      ) : (
        <p className="empty-state">No note for this day.</p>
      )}

      {day.photos.length > 0 && (
        <div className="card">
          <h2 className="section-label">Photos</h2>
          <div className="photo-grid">
            {day.photos.map((p, i) => (
              <div
                key={p.id}
                className="photo-grid-item"
                onClick={() => setLightboxIndex(i)}
                role="button"
                tabIndex={0}
              >
                <img src={p.url} alt={p.note || ''} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="section-label">Expenses</h2>
        {day.expenses.length === 0 && <p className="empty-state">Nothing logged for this day.</p>}
        <ul className="expense-list">
          {day.expenses.map((e) => (
            <li key={e.id}>
              <div className="expense-row">
                <span className={`expense-icon cat-${e.category}`}>{CATEGORY_EMOJI[e.category]}</span>
                <div className="expense-info">
                  <span className="expense-name">{e.name}</span>
                </div>
                <div className="expense-amount">
                  <span className="expense-amount-yen">¥{e.amountYen.toLocaleString()}</span>
                  <span className="expense-amount-home">
                    {e.amountHome.toFixed(2)} {trip.homeCurrency}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2 className="section-label">Places</h2>
        <PlacesMap places={day.places} focusRequest={focusRequest} />
        {day.places.length === 0 && <p className="empty-state">No places logged for this day.</p>}
        <ul className="place-list">
          {day.places.map((p) => (
            <li key={p.id}>
              <div className="place-row" onClick={() => focusPlace(p.id)} role="button" tabIndex={0}>
                <span className="place-icon">
                  <PinIcon size={16} />
                </span>
                <div className="place-info">
                  <span className="place-name">
                    {p.name}
                    {p.address && ` — ${p.address}`}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2 className="section-label">Comments</h2>
        {comments === null ? (
          <p className="loading-state">Loading comments...</p>
        ) : (
          <>
            {comments.length === 0 && <p className="empty-state">No comments yet.</p>}
            <ul className="comment-list">
              {comments.map((c) => {
                const isOwnComment = c.user.id === user?.id
                const canDelete = isOwnComment || trip.createdBy === user?.id
                return (
                  <li key={c.id} className="comment-row">
                    <div className="comment-header">
                      <span className="comment-author">{c.user.name}</span>
                      <span className="comment-time">{formatDateTime(c.createdAt)}</span>
                    </div>
                    <p className="comment-text">{c.text}</p>
                    <div className="comment-actions">
                      {canDelete && (
                        <button
                          type="button"
                          className="comment-action-link"
                          onClick={() => setDeletingComment(c)}
                        >
                          Delete
                        </button>
                      )}
                      {!isOwnComment && (
                        <>
                          <button
                            type="button"
                            className="comment-action-link"
                            onClick={() => setReportingComment(c)}
                          >
                            Report
                          </button>
                          <button
                            type="button"
                            className="comment-action-link"
                            onClick={() => handleBlockCommenter(c.user.id)}
                          >
                            Block
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
        <form className="comment-form" onSubmit={handleAddComment}>
          <input
            type="text"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button type="submit" disabled={postingComment || !commentText.trim()}>
            Post
          </button>
        </form>
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox photos={day.photos} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}

      {showSharePicker && (
        <div className="sheet-backdrop" onClick={() => setShowSharePicker(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h3>Share with a friend</h3>
            {sharedWith ? (
              <p>Shared with {sharedWith}!</p>
            ) : !friends ? (
              <p className="loading-state">Loading friends...</p>
            ) : friends.length === 0 ? (
              <p className="empty-state">
                No friends yet — <Link to="/friends">add one</Link> first.
              </p>
            ) : (
              <ul className="friend-list">
                {friends.map((f) => (
                  <li key={f.id} className="friend-row">
                    <span className="friend-name">{f.user.name}</span>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => handleShareToFriend(f.user.id, f.user.name)}
                    >
                      Send
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className="sheet-cancel" onClick={() => setShowSharePicker(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {reportingTrip && (
        <div className="confirm-backdrop" onClick={() => setReportingTrip(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <p>Report this trip?</p>
            <textarea
              className="report-reason"
              placeholder="Reason (optional)"
              value={tripReportReason}
              onChange={(e) => setTripReportReason(e.target.value)}
            />
            <button type="button" onClick={handleReportTrip}>
              Submit report
            </button>
            <button type="button" className="sheet-cancel" onClick={() => setReportingTrip(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {deletingComment && (
        <ConfirmDialog
          message="Delete this comment?"
          onConfirm={handleDeleteComment}
          onCancel={() => setDeletingComment(null)}
        />
      )}

      {reportingComment && (
        <div className="confirm-backdrop" onClick={() => setReportingComment(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <p>Report this comment?</p>
            <textarea
              className="report-reason"
              placeholder="Reason (optional)"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
            <button type="button" onClick={handleReportComment}>
              Submit report
            </button>
            <button type="button" className="sheet-cancel" onClick={() => setReportingComment(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
