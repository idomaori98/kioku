import { useEffect, useRef, useState } from 'react'
import { api } from '../api'

const CATEGORIES = [
  { value: 'food', emoji: '🍜', label: 'Food' },
  { value: 'transport', emoji: '🚆', label: 'Transit' },
  { value: 'fun', emoji: '🎡', label: 'Fun' },
  { value: 'shopping', emoji: '🛍️', label: 'Shopping' },
  { value: 'other', emoji: '📦', label: 'Other' },
]

export function ExpenseForm({
  tripId,
  day,
  tripType,
  members,
  currentUserId,
  expense,
  onSaved,
  onClose,
}) {
  const [amountYen, setAmountYen] = useState(expense ? String(expense.amountYen) : '')
  const [name, setName] = useState(expense?.name ?? '')
  const [category, setCategory] = useState(expense?.category ?? 'food')
  const [paidBy, setPaidBy] = useState(expense?.paidBy?.id ?? currentUserId)
  const [error, setError] = useState(null)
  const amountRef = useRef(null)

  useEffect(() => {
    amountRef.current?.focus()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      const body = {
        day,
        name,
        category,
        amountYen: Number(amountYen),
        ...(tripType === 'family' ? {} : { paidBy }),
      }
      const saved = expense
        ? await api.updateExpense(tripId, expense.id, body)
        : await api.createExpense(tripId, body)
      onSaved(saved)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form className="sheet expense-form" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <input
          ref={amountRef}
          type="number"
          inputMode="numeric"
          placeholder="¥ Amount"
          className="amount-input"
          value={amountYen}
          onChange={(e) => setAmountYen(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="What was it?"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="category-chips">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.value}
              className={`chip cat-${c.value} ${category === c.value ? 'chip-selected' : ''}`}
              onClick={() => setCategory(c.value)}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
        {tripType !== 'family' && (
          <label>
            Who paid
            <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.id === currentUserId ? `${m.user.name} (you)` : m.user.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {error && <p className="error">{error}</p>}
        <button type="submit">{expense ? 'Save changes' : 'Add expense'}</button>
        <button type="button" className="sheet-cancel" onClick={onClose}>
          Cancel
        </button>
      </form>
    </div>
  )
}

export { CATEGORIES }
