import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { loadGoogleMaps } from '../lib/googleMaps'

const DEBOUNCE_MS = 300

export function PlaceForm({ tripId, day, onSaved, onClose }) {
  const [mode, setMode] = useState('search') // 'search' | 'manual'
  const [name, setName] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [locating, setLocating] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    return () => clearTimeout(debounceRef.current)
  }, [])

  function handleSearchChange(value) {
    setName(value)
    setSelected(null)
    clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        await loadGoogleMaps()
        const { suggestions: results } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
          { input: value }
        )
        setSuggestions(results)
      } catch {
        setSuggestions([])
      }
    }, DEBOUNCE_MS)
  }

  async function handleSuggestionClick(suggestion) {
    const place = suggestion.placePrediction.toPlace()
    await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location', 'id'] })
    setName(place.displayName)
    setSelected({
      googlePlaceId: place.id,
      address: place.formattedAddress || '',
      lat: place.location.lat(),
      lng: place.location.lng(),
    })
    setSuggestions([])
  }

  function switchToManual() {
    setMode('manual')
    setSelected(null)
    setSuggestions([])
    setName('')
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Enter a place name')
      return
    }

    setSubmitting(true)
    try {
      let body
      if (mode === 'search' && selected) {
        body = { day, name, source: 'google', ...selected }
      } else {
        let lat, lng
        if (navigator.geolocation) {
          setLocating(true)
          try {
            const pos = await new Promise((resolve, reject) =>
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
            )
            lat = pos.coords.latitude
            lng = pos.coords.longitude
          } catch {
            // Location denied or unavailable — save the place without coordinates.
          } finally {
            setLocating(false)
          }
        }
        body = { day, name, source: 'manual', lat, lng }
      }
      const place = await api.createPlace(tripId, body)
      onSaved(place)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="sheet-backdrop" onClick={submitting ? undefined : onClose}>
      <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        {mode === 'search' ? (
          <>
            <input
              type="text"
              placeholder="Search for a place..."
              value={name}
              onChange={(e) => handleSearchChange(e.target.value)}
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <ul className="place-suggestions">
                {suggestions.map((s) => (
                  <li key={s.placePrediction.placeId}>
                    <button type="button" onClick={() => handleSuggestionClick(s)}>
                      {s.placePrediction.text.text}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className="sheet-cancel" onClick={switchToManual}>
              Add as my own place
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="Place name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <p className="placeholder-msg">
              {locating
                ? 'Getting your location...'
                : "We'll save your current location with this place."}
            </p>
          </>
        )}
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save place'}
        </button>
        <button type="button" className="sheet-cancel" onClick={onClose} disabled={submitting}>
          Cancel
        </button>
      </form>
    </div>
  )
}
