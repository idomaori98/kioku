import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { AlertIcon, FlagIcon } from '../components/icons'
import { timeAgo } from '../lib/timeAgo'

const TYPE_LABEL = { comment: 'Comment', trip: 'Trip', user: 'User' }

export function AdminPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [showResolved, setShowResolved] = useState(false)
  const [busyId, setBusyId] = useState(null)

  function load() {
    setError(null)
    setData(null)
    api
      .adminListReports(showResolved ? 'all' : undefined)
      .then(setData)
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    if (user?.isAdmin) load()
  }, [showResolved])

  if (!user?.isAdmin) {
    return (
      <EmptyState
        icon={AlertIcon}
        title="Admins only"
        message="You don't have access to this page."
        actionLabel="Back home"
        actionTo="/"
      />
    )
  }

  async function act(id, fn) {
    setBusyId(id)
    setError(null)
    try {
      await fn()
      load()
    } catch (err) {
      setError(err.message)
      setBusyId(null)
    }
  }

  const resolve = (r) => act(r.id, () => api.adminResolveReport(r.id))
  const deleteComment = (r) => act(r.id, () => api.adminDeleteComment(r.targetId))
  const unpublishTrip = (r) => act(r.id, () => api.adminUnpublishTrip(r.targetId))

  return (
    <div>
      <header className="discover-head discover-head-row">
        <h1>Reports</h1>
        {data && <span className="admin-open-count">{data.openCount} open</span>}
      </header>

      <label className="admin-toggle">
        <input
          type="checkbox"
          checked={showResolved}
          onChange={(e) => setShowResolved(e.target.checked)}
        />
        Show resolved
      </label>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !data ? (
        <>
          <div className="skeleton-block skeleton-row" aria-hidden="true" />
          <div className="skeleton-block skeleton-row" aria-hidden="true" />
        </>
      ) : data.reports.length === 0 ? (
        <EmptyState
          icon={FlagIcon}
          title="Nothing to review"
          message={showResolved ? 'No reports yet.' : 'No open reports. Nice and quiet.'}
        />
      ) : (
        <ul className="admin-report-list">
          {data.reports.map((r) => (
            <li key={r.id} className={`admin-report ${r.resolved ? 'admin-report-resolved' : ''}`}>
              <div className="admin-report-head">
                <span className="admin-report-type">{TYPE_LABEL[r.targetType]}</span>
                <span className="admin-report-time">{timeAgo(r.createdAt)}</span>
                {r.resolved && <span className="admin-report-badge">Resolved</span>}
              </div>

              <div className="admin-report-body">
                {r.targetType === 'comment' &&
                  (r.target?.deleted ? (
                    <p className="admin-report-gone">Comment already deleted.</p>
                  ) : (
                    <>
                      <p className="admin-report-quote">“{r.target.text}”</p>
                      <p className="admin-report-meta">
                        by {r.target.authorName}
                        {r.target.tripId && (
                          <>
                            {' · '}
                            <Link to={`/trips/${r.target.tripId}/public`}>view trip</Link>
                          </>
                        )}
                      </p>
                    </>
                  ))}
                {r.targetType === 'trip' &&
                  (r.target?.deleted ? (
                    <p className="admin-report-gone">Trip no longer exists.</p>
                  ) : (
                    <p className="admin-report-meta">
                      <Link to={`/trips/${r.targetId}/public`}>{r.target.name}</Link>
                      {' · '}
                      {r.target.published ? 'published' : 'not published'}
                    </p>
                  ))}
                {r.targetType === 'user' && (
                  <p className="admin-report-meta">
                    User: {r.target?.deleted ? 'deleted account' : r.target.name}
                  </p>
                )}
                {r.reason && <p className="admin-report-reason">Reason: {r.reason}</p>}
                <p className="admin-report-reporter">Reported by {r.reporterName}</p>
              </div>

              {!r.resolved && (
                <div className="admin-report-actions">
                  {r.targetType === 'comment' && !r.target?.deleted && (
                    <button
                      type="button"
                      className="btn-danger btn-sm"
                      disabled={busyId === r.id}
                      onClick={() => deleteComment(r)}
                    >
                      Delete comment
                    </button>
                  )}
                  {r.targetType === 'trip' && !r.target?.deleted && r.target.published && (
                    <button
                      type="button"
                      className="btn-danger btn-sm"
                      disabled={busyId === r.id}
                      onClick={() => unpublishTrip(r)}
                    >
                      Unpublish
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    disabled={busyId === r.id}
                    onClick={() => resolve(r)}
                  >
                    Mark resolved
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
