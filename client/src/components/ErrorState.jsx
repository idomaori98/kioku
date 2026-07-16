import { AlertIcon } from './icons'

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state-panel">
      <AlertIcon size={36} />
      <p className="state-panel-title">Something went wrong</p>
      <p className="state-panel-message">{message || 'Please try again.'}</p>
      {onRetry && (
        <button type="button" className="state-panel-action" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
