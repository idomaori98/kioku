import { useRef, useState } from 'react'

const REVEAL_WIDTH = 132
const OPEN_THRESHOLD = 40

export function SwipeableRow({ onEdit, onDelete, children }) {
  const [dragX, setDragX] = useState(0)
  const [open, setOpen] = useState(false)
  const startXRef = useRef(null)
  const draggingRef = useRef(false)

  function handlePointerDown(e) {
    startXRef.current = e.clientX
    draggingRef.current = false
  }

  function handlePointerMove(e) {
    if (startXRef.current === null) return
    const delta = e.clientX - startXRef.current
    if (Math.abs(delta) > 5) draggingRef.current = true
    const base = open ? REVEAL_WIDTH : 0
    const next = Math.min(REVEAL_WIDTH, Math.max(0, base + delta))
    setDragX(next)
  }

  function endDrag() {
    if (startXRef.current === null) return
    const shouldOpen = dragX > OPEN_THRESHOLD
    setOpen(shouldOpen)
    setDragX(shouldOpen ? REVEAL_WIDTH : 0)
    startXRef.current = null
  }

  function handleContentClickCapture(e) {
    if (draggingRef.current) {
      e.stopPropagation()
      draggingRef.current = false
      return
    }
    if (open) {
      e.stopPropagation()
      setOpen(false)
      setDragX(0)
    }
  }

  function close() {
    setOpen(false)
    setDragX(0)
  }

  return (
    <div className="swipe-row">
      <div className="swipe-actions">
        <button
          type="button"
          className="swipe-action swipe-edit"
          aria-label="Edit"
          onClick={() => {
            close()
            onEdit()
          }}
        >
          ✏️
        </button>
        <button
          type="button"
          className="swipe-action swipe-delete"
          aria-label="Delete"
          onClick={() => onDelete()}
        >
          🗑️
        </button>
      </div>
      <div
        className="swipe-content"
        style={{ transform: `translateX(${dragX}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={handleContentClickCapture}
      >
        {children}
      </div>
    </div>
  )
}
