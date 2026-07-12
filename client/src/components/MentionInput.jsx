import { useEffect, useRef, useState } from 'react'
import { findActiveQuery, insertMention, reconcileMentions } from '../lib/mentions'

const TYPE_ICON = { member: '👤', place: '📍', expense: '💴', photo: '📷' }

export function MentionInput({ text, mentions, candidates, onChange, onSubmit, disabled, placeholder }) {
  const textareaRef = useRef(null)
  const pendingCursorRef = useRef(null)
  const [cursorPos, setCursorPos] = useState(text.length)
  const [highlighted, setHighlighted] = useState(0)

  useEffect(() => {
    if (pendingCursorRef.current === null) return
    const pos = pendingCursorRef.current
    pendingCursorRef.current = null
    const el = textareaRef.current
    if (el) {
      el.focus()
      el.setSelectionRange(pos, pos)
    }
  }, [text])

  const activeQuery = findActiveQuery(text, mentions, cursorPos)
  const query = activeQuery?.query.toLowerCase() || ''
  const suggestions = activeQuery
    ? candidates.filter((c) => c.label.toLowerCase().includes(query)).slice(0, 6)
    : []

  function updateCursor(e) {
    setCursorPos(e.target.selectionStart)
  }

  function handleChangeText(e) {
    const newText = e.target.value
    const newCursor = e.target.selectionStart
    const newMentions = reconcileMentions(text, mentions, newText)
    onChange(newText, newMentions)
    setCursorPos(newCursor)
    setHighlighted(0)
  }

  function selectCandidate(candidate) {
    const result = insertMention(text, mentions, activeQuery.atIndex, cursorPos, candidate)
    pendingCursorRef.current = result.cursorPos
    onChange(result.text, result.mentions)
  }

  function handleKeyDown(e) {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlighted((i) => (i + 1) % suggestions.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlighted((i) => (i - 1 + suggestions.length) % suggestions.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        selectCandidate(suggestions[highlighted])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        return
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="mention-input">
      {suggestions.length > 0 && (
        <ul className="mention-suggestions">
          {suggestions.map((c, i) => (
            <li key={`${c.type}-${c.id}`}>
              <button
                type="button"
                className={`mention-suggestion ${i === highlighted ? 'mention-suggestion-active' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectCandidate(c)}
              >
                <span className="mention-suggestion-icon">{TYPE_ICON[c.type]}</span>
                {c.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <textarea
        ref={textareaRef}
        className="mention-textarea"
        rows={1}
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        onChange={handleChangeText}
        onKeyDown={handleKeyDown}
        onSelect={updateCursor}
        onClick={updateCursor}
      />
    </div>
  )
}
