import { useState } from 'react'
import { api } from '../api'

export function PlaceEditSheet({ tripId, place, onSaved, onClose }) {
  const [name, setName] = useState(place.name)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      const saved = await api.updatePlace(tripId, place.id, { name })
      onSaved(saved)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Place name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">Save changes</button>
        <button type="button" className="sheet-cancel" onClick={onClose}>
          Cancel
        </button>
      </form>
    </div>
  )
}
