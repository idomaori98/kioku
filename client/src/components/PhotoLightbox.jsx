import { useRef, useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'

const SWIPE_THRESHOLD = 50

export function PhotoLightbox({ photos, startIndex, onClose, onDelete }) {
  const [index, setIndex] = useState(startIndex)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const startXRef = useRef(null)

  const photo = photos[index]
  const hasPrev = index > 0
  const hasNext = index < photos.length - 1

  function goPrev(e) {
    e.stopPropagation()
    if (hasPrev) setIndex((i) => i - 1)
  }

  function goNext(e) {
    e.stopPropagation()
    if (hasNext) setIndex((i) => i + 1)
  }

  function handlePointerDown(e) {
    startXRef.current = e.clientX
  }

  function handlePointerUp(e) {
    if (startXRef.current === null) return
    const delta = e.clientX - startXRef.current
    startXRef.current = null
    if (delta > SWIPE_THRESHOLD && hasPrev) {
      setIndex((i) => i - 1)
    } else if (delta < -SWIPE_THRESHOLD && hasNext) {
      setIndex((i) => i + 1)
    } else if (Math.abs(delta) < 10) {
      onClose()
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true)
    setError(null)
    try {
      await onDelete(photo)
      onClose()
    } catch (err) {
      setError(err.message)
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <div className="lightbox-stage" onClick={(e) => e.stopPropagation()}>
        {hasPrev && (
          <button type="button" className="lightbox-nav lightbox-prev" onClick={goPrev} aria-label="Previous photo">
            ‹
          </button>
        )}
        <img
          src={photo.url}
          alt={photo.note || ''}
          className="lightbox-img"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
        {hasNext && (
          <button type="button" className="lightbox-nav lightbox-next" onClick={goNext} aria-label="Next photo">
            ›
          </button>
        )}
      </div>
      {onDelete && (
        <button
          type="button"
          className="lightbox-delete"
          onClick={(e) => {
            e.stopPropagation()
            setConfirming(true)
          }}
        >
          🗑️ Delete photo
        </button>
      )}
      {error && <p className="error">{error}</p>}
      {photo.note && <p className="lightbox-caption">{photo.note}</p>}
      {photos.length > 1 && (
        <p className="lightbox-counter">
          {index + 1} / {photos.length}
        </p>
      )}
      {confirming && (
        <ConfirmDialog
          message="Delete this photo? This can't be undone."
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirming(false)}
          pending={deleting}
        />
      )}
    </div>
  )
}
