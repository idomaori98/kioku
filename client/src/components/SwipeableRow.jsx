import { useRef, useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'

const ACTION_WIDTH = 56
const ACTION_GAP = 8
const OPEN_THRESHOLD = 40

function buildActions({ actions, onEdit, onDelete, deleteMessage }) {
  if (actions) return actions
  const built = []
  if (onEdit) {
    built.push({ key: 'edit', icon: '✏️', label: 'Edit', className: 'swipe-edit', onClick: onEdit })
  }
  if (onDelete) {
    built.push({
      key: 'delete',
      icon: '🗑️',
      label: 'Delete',
      className: 'swipe-delete',
      onClick: onDelete,
      confirmMessage: deleteMessage || 'Delete this?',
    })
  }
  return built
}

export function SwipeableRow({ actions, onEdit, onDelete, deleteMessage, children }) {
  const resolvedActions = buildActions({ actions, onEdit, onDelete, deleteMessage })
  const revealWidth = resolvedActions.length * ACTION_WIDTH + (resolvedActions.length - 1) * ACTION_GAP + 8

  const [dragX, setDragX] = useState(0)
  const [open, setOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
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
    const base = open ? revealWidth : 0
    const next = Math.min(revealWidth, Math.max(0, base + delta))
    setDragX(next)
  }

  function endDrag() {
    if (startXRef.current === null) return
    const shouldOpen = dragX > OPEN_THRESHOLD
    setOpen(shouldOpen)
    setDragX(shouldOpen ? revealWidth : 0)
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

  function handleActionClick(action) {
    if (action.confirmMessage) {
      setPendingAction(action)
    } else {
      close()
      action.onClick()
    }
  }

  function handleConfirm() {
    const action = pendingAction
    setPendingAction(null)
    close()
    action.onClick()
  }

  if (resolvedActions.length === 0) return children

  return (
    <div className="swipe-row">
      <div className="swipe-actions">
        {resolvedActions.map((action) => (
          <button
            key={action.key}
            type="button"
            className={`swipe-action ${action.className || ''}`}
            aria-label={action.label}
            onClick={() => handleActionClick(action)}
          >
            {action.icon}
          </button>
        ))}
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
      {pendingAction && (
        <ConfirmDialog
          message={pendingAction.confirmMessage}
          onConfirm={handleConfirm}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </div>
  )
}
