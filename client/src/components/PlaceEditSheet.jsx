import { useState } from 'react'
import { api } from '../api'

export function PlaceEditSheet({ tripId, place, onSaved, onDeleted, onClose }) {
  const [name, setName] = useState(place.name)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

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

  async function handleDelete() {
    setError(null)
    setDeleting(true)
    try {
      await api.deletePlace(tripId, place.id)
      onDeleted(place.id)
    } catch (err) {
      setError(err.message)
      setDeleting(false)
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
        <button type="submit" disabled={deleting}>
          Save changes
        </button>
        <button type="button" className="btn-secondary" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete place'}
        </button>
        <button type="button" className="sheet-cancel" onClick={onClose} disabled={deleting}>
          Cancel
        </button>
      </form>
    </div>
  )
}
