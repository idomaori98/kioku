import { Link } from 'react-router-dom'

export function EmptyState({ icon: Icon, title, message, actionLabel, actionTo, onAction }) {
  return (
    <div className="state-panel">
      {Icon && <Icon size={36} />}
      {title && <p className="state-panel-title">{title}</p>}
      {message && <p className="state-panel-message">{message}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-secondary state-panel-action">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && (
        <button type="button" className="btn-secondary state-panel-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
