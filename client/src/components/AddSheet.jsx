export function AddSheet({ onSelect, onClose }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-option" onClick={() => onSelect('photo')}>
          📷 Photo
        </button>
        <button className="sheet-option" onClick={() => onSelect('expense')}>
          💴 Expense
        </button>
        <button className="sheet-option" onClick={() => onSelect('place')}>
          📍 Place
        </button>
        <button className="sheet-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}
