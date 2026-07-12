import { formatDayLabel } from '../lib/days'

function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function MentionDetailSheet({ type, item, onClose }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet mention-detail-sheet" onClick={(e) => e.stopPropagation()}>
        {type === 'member' && (
          <>
            <h3>👤 {item.label}</h3>
            <p className="mention-detail-row">{item.role === 'admin' ? 'Admin' : 'Member'}</p>
            <p className="mention-detail-row">Joined {formatDateTime(item.joinedAt)}</p>
          </>
        )}

        {type === 'place' && (
          <>
            <h3>📍 {item.label}</h3>
            {item.address && <p className="mention-detail-row">{item.address}</p>}
            <p className="mention-detail-row">{formatDayLabel(item.day)}</p>
            <p className="mention-detail-row">
              Added by {item.addedByName} · {formatDateTime(item.createdAt)}
            </p>
          </>
        )}

        {type === 'expense' && (
          <>
            <h3>💴 {item.label}</h3>
            <p className="mention-detail-row">
              ¥{item.amountYen.toLocaleString()} ({item.amountHome.toFixed(2)} {item.homeCurrency})
            </p>
            <p className="mention-detail-row">{formatDayLabel(item.day)}</p>
            {item.paidByName && (
              <p className="mention-detail-row">
                Paid by {item.paidByName} · added by {item.addedByName}
              </p>
            )}
            <p className="mention-detail-row">{formatDateTime(item.createdAt)}</p>
          </>
        )}

        {type === 'photo' && (
          <>
            <h3>📷 {item.label}</h3>
            <img className="mention-detail-photo" src={item.url} alt={item.note || ''} />
            <p className="mention-detail-row">{formatDayLabel(item.day)}</p>
            <p className="mention-detail-row">
              Added by {item.addedByName} · {formatDateTime(item.createdAt)}
            </p>
          </>
        )}

        <button type="button" className="sheet-cancel" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
