import { useEffect, useRef, useState } from 'react'
import { api } from '../api'

const CATEGORIES = [
  { value: 'food', emoji: '🍜', label: 'Food' },
  { value: 'transport', emoji: '🚆', label: 'Transit' },
  { value: 'fun', emoji: '🎡', label: 'Fun' },
  { value: 'shopping', emoji: '🛍️', label: 'Shopping' },
  { value: 'other', emoji: '📦', label: 'Other' },
]

export function ExpenseForm({ tripId, day, tripType, members, currentUserId, onSaved, onClose }) {
  const [amountYen, setAmountYen] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('food')
  const [paidBy, setPaidBy] = useState(currentUserId)
  const [error, setError] = useState(null)
  const amountRef = useRef(null)

  useEffect(() => {
    amountRef.current?.focus()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      const expense = await api.createExpense(tripId, {
        day,
        name,
        category,
        amountYen: Number(amountYen),
        ...(tripType === 'family' ? {} : { paidBy }),
      })
      onSaved(expense)
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
        <button type="submit">Add expense</button>
        <button type="button" className="sheet-cancel" onClick={onClose}>
          Cancel
        </button>
      </form>
    </div>
  )
}

export { CATEGORIES }
