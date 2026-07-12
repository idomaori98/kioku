import { useRef, useState } from 'react'

const LONG_PRESS_MS = 450
const MOVE_CANCEL_PX = 8

export function DragReorderList({
  items,
  keyField = 'id',
  onReorder,
  disabled,
  as: Tag = 'ul',
  itemAs: ItemTag = 'li',
  className,
  itemClassName,
  trailing,
  renderItem,
}) {
  const [dragState, setDragState] = useState(null)
  const itemRefs = useRef({})
  const listRef = useRef(null)
  const pendingRef = useRef(null)
  const timerRef = useRef(null)
  const justDraggedRef = useRef(false)

  const baseOrder = items.map((it) => String(it[keyField]))
  const order = dragState ? dragState.order : baseOrder
  const displayItems = order
    .map((id) => items.find((it) => String(it[keyField]) === id))
    .filter(Boolean)

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  function handlePointerDownCapture(e) {
    if (disabled || dragState) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const itemEl = e.target.closest('[data-drag-id]')
    if (!itemEl) return
    const id = itemEl.dataset.dragId
    pendingRef.current = { id, startX: e.clientX, startY: e.clientY, pointerId: e.pointerId }
    clearTimer()
    timerRef.current = setTimeout(() => {
      const pending = pendingRef.current
      if (!pending) return
      try {
        listRef.current?.setPointerCapture(pending.pointerId)
      } catch {
        // Pointer capture is best-effort; the hit-test drag logic works without it too.
      }
      setDragState({
        id: pending.id,
        pointerId: pending.pointerId,
        order: baseOrder.slice(),
        startX: pending.startX,
        startY: pending.startY,
        x: pending.startX,
        y: pending.startY,
      })
    }, LONG_PRESS_MS)
  }

  function handlePointerMoveCapture(e) {
    if (dragState && e.pointerId === dragState.pointerId) {
      e.stopPropagation()
      const x = e.clientX
      const y = e.clientY
      setDragState((prev) => {
        if (!prev) return prev
        let newOrder = prev.order
        for (const otherId of prev.order) {
          if (otherId === prev.id) continue
          const el = itemRefs.current[otherId]
          if (!el) continue
          const rect = el.getBoundingClientRect()
          if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            const fromIndex = prev.order.indexOf(prev.id)
            const toIndex = prev.order.indexOf(otherId)
            newOrder = prev.order.slice()
            newOrder.splice(fromIndex, 1)
            newOrder.splice(toIndex, 0, prev.id)
            break
          }
        }
        return { ...prev, x, y, order: newOrder }
      })
      return
    }
    if (pendingRef.current && pendingRef.current.pointerId === e.pointerId) {
      const dx = e.clientX - pendingRef.current.startX
      const dy = e.clientY - pendingRef.current.startY
      if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) {
        clearTimer()
        pendingRef.current = null
      }
    }
  }

  function handlePointerUpCapture(e) {
    if (dragState && e.pointerId === dragState.pointerId) {
      e.stopPropagation()
      const finalOrder = dragState.order
      justDraggedRef.current = true
      setDragState(null)
      const changed = finalOrder.some((id, i) => id !== baseOrder[i])
      if (changed) {
        const reordered = finalOrder
          .map((id) => items.find((it) => String(it[keyField]) === id))
          .filter(Boolean)
        onReorder(reordered)
      }
      return
    }
    if (pendingRef.current && pendingRef.current.pointerId === e.pointerId) {
      clearTimer()
      pendingRef.current = null
    }
  }

  function handleClickCapture(e) {
    if (justDraggedRef.current) {
      justDraggedRef.current = false
      e.stopPropagation()
    }
  }

  return (
    <Tag
      ref={listRef}
      className={className}
      onPointerDownCapture={handlePointerDownCapture}
      onPointerMoveCapture={handlePointerMoveCapture}
      onPointerUpCapture={handlePointerUpCapture}
      onPointerCancelCapture={handlePointerUpCapture}
      onClickCapture={handleClickCapture}
    >
      {displayItems.map((item) => {
        const id = String(item[keyField])
        const isDragging = dragState?.id === id
        const style = isDragging
          ? {
              transform: `translate(${dragState.x - dragState.startX}px, ${dragState.y - dragState.startY}px)`,
              zIndex: 20,
              position: 'relative',
            }
          : undefined
        return (
          <ItemTag
            key={id}
            data-drag-id={id}
            ref={(el) => {
              itemRefs.current[id] = el
            }}
            className={`${itemClassName || ''} ${isDragging ? 'drag-item-dragging' : ''}`.trim()}
            style={style}
          >
            {renderItem(item)}
          </ItemTag>
        )
      })}
      {trailing}
    </Tag>
  )
}
