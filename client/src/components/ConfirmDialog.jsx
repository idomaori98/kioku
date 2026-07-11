export function ConfirmDialog({ message, onConfirm, onCancel, pending }) {
  return (
    <div className="confirm-backdrop" onClick={pending ? undefined : onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <p>{message}</p>
        <button type="button" className="btn-danger" onClick={onConfirm} disabled={pending}>
          {pending ? 'Deleting...' : 'Delete'}
        </button>
        <button type="button" className="sheet-cancel" onClick={onCancel} disabled={pending}>
          Cancel
        </button>
      </div>
    </div>
  )
}
