import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { MessageCircleIcon, UsersIcon } from '../components/icons'

export function FriendsPage() {
  const [friends, setFriends] = useState(null)
  const [requests, setRequests] = useState(null)
  const [error, setError] = useState(null)
  const [email, setEmail] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searchError, setSearchError] = useState(null)
  const [searching, setSearching] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  const [removingFriend, setRemovingFriend] = useState(null)

  function load() {
    setError(null)
    setFriends(null)
    setRequests(null)
    Promise.all([api.listFriends(), api.listFriendRequests()])
      .then(([f, r]) => {
        setFriends(f)
        setRequests(r)
      })
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSearch(e) {
    e.preventDefault()
    setSearchError(null)
    setSearchResult(null)
    setRequestSent(false)
    setSearching(true)
    try {
      const user = await api.findUserByEmail(email)
      setSearchResult(user)
    } catch (err) {
      setSearchError(err.message)
    } finally {
      setSearching(false)
    }
  }

  async function handleSendRequest() {
    setSearchError(null)
    try {
      await api.sendFriendRequest(searchResult.id)
      setRequestSent(true)
    } catch (err) {
      setSearchError(err.message)
    }
  }

  async function handleAccept(requesterId) {
    try {
      await api.acceptFriendRequest(requesterId)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDecline(requesterId) {
    try {
      await api.declineFriendRequest(requesterId)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleRemoveFriend() {
    try {
      await api.removeFriend(removingFriend.id)
      setRemovingFriend(null)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const loading = !friends || !requests

  return (
    <div>
      <h1>Friends</h1>

      <form className="card" onSubmit={handleSearch}>
        <h2 className="section-label">Add a friend</h2>
        <input
          type="email"
          placeholder="Their email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={searching}>
          {searching ? 'Searching...' : 'Find'}
        </button>
        {searchError && <p className="error">{searchError}</p>}
        {searchResult && (
          <div className="friend-search-result">
            <span>{searchResult.name}</span>
            <button type="button" onClick={handleSendRequest} disabled={requestSent}>
              {requestSent ? 'Request sent!' : 'Send friend request'}
            </button>
          </div>
        )}
      </form>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <>
          <div className="skeleton-block skeleton-row" aria-hidden="true" />
          <div className="skeleton-block skeleton-row" aria-hidden="true" />
        </>
      ) : (
        <>
          {requests.length > 0 && (
            <div className="card">
              <h2 className="section-label">Friend requests</h2>
              <ul className="friend-list">
                {requests.map((r) => (
                  <li key={r.id} className="friend-row">
                    <span className="friend-name">{r.user.name}</span>
                    <div className="friend-row-actions">
                      <button type="button" className="btn-secondary btn-sm" onClick={() => handleAccept(r.user.id)}>
                        Accept
                      </button>
                      <button type="button" className="btn-secondary btn-sm" onClick={() => handleDecline(r.user.id)}>
                        Decline
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {friends.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="No friends yet"
              message="Add someone by their email above to share trips and message each other."
            />
          ) : (
            <div className="card">
              <h2 className="section-label">Your friends</h2>
              <ul className="friend-list">
                {friends.map((f) => (
                  <li key={f.id} className="friend-row">
                    <span className="friend-name">{f.user.name}</span>
                    <div className="friend-row-actions">
                      <Link className="btn-secondary btn-sm nav-inline-link" to={`/messages/${f.user.id}`}>
                        <MessageCircleIcon size={16} /> Message
                      </Link>
                      <button type="button" className="btn-secondary btn-sm" onClick={() => setRemovingFriend(f.user)}>
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {removingFriend && (
        <ConfirmDialog
          message={`Remove ${removingFriend.name} as a friend?`}
          onConfirm={handleRemoveFriend}
          onCancel={() => setRemovingFriend(null)}
          confirmLabel="Remove"
          pendingLabel="Removing..."
        />
      )}
    </div>
  )
}
