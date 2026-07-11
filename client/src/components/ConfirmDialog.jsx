export function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="confirm-backdrop" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <p>{message}</p>
        <button type="button" className="btn-danger" onClick={onConfirm}>
          Delete
        </button>
        <button type="button" className="sheet-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
