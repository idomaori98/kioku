import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'

export function BalancesPage() {
  const { id } = useParams()
  const [trip, setTrip] = useState(null)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([api.getTrip(id), api.getBalances(id)])
      .then(([t, d]) => {
        setTrip(t)
        setData(d)
      })
      .catch((err) => setError(err.message))
  }, [id])

  if (error) return <p className="full-page-error">{error}</p>
  if (!trip || !data) return <p className="loading-state">Loading...</p>

  return (
    <div>
      <h1>{trip.name} — Balances</h1>
      <p>
        <Link className="btn-secondary btn-sm" to={`/trips/${id}`}>
          ← Back to trip
        </Link>
      </p>

      <div className="card">
        <h2 className="section-label">Who's owed what</h2>
        <ul className="balance-list">
          {data.balances.map((b) => (
            <li key={b.userId} className="balance-row">
              <span className="balance-name">{b.name}</span>
              {b.netYen > 0 && (
                <span className="balance-amount balance-positive">
                  is owed ¥{b.netYen.toLocaleString()} ({b.netHome.toFixed(2)} {data.homeCurrency})
                </span>
              )}
              {b.netYen < 0 && (
                <span className="balance-amount balance-negative">
                  owes ¥{Math.abs(b.netYen).toLocaleString()} ({Math.abs(b.netHome).toFixed(2)}{' '}
                  {data.homeCurrency})
                </span>
              )}
              {b.netYen === 0 && <span className="balance-amount balance-settled">settled up</span>}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2 className="section-label">Settle up</h2>
        {data.settlements.length === 0 ? (
          <p className="empty-state">Everyone's settled up! 🎉</p>
        ) : (
          <ul className="settlement-list">
            {data.settlements.map((s, i) => (
              <li key={i} className="settlement-row">
                <span className="settlement-from">{s.fromName}</span>
                <span className="settlement-arrow">→</span>
                <span className="settlement-to">{s.toName}</span>
                <span className="settlement-amount">
                  ¥{s.amountYen.toLocaleString()} ({s.amountHome.toFixed(2)} {data.homeCurrency})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
