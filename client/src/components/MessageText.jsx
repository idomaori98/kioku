import { parseMessageText } from '../lib/mentions'

const TYPE_ICON = { member: '👤', place: '📍', expense: '💴', photo: '📷' }

export function MessageText({ text, resolveMention, onMentionClick }) {
  const segments = parseMessageText(text)

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.kind === 'text') return <span key={i}>{seg.value}</span>
        const resolved = resolveMention(seg.mentionType, seg.id)
        if (!resolved) {
          return (
            <span key={i} className="mention-chip mention-chip-missing">
              @deleted
            </span>
          )
        }
        return (
          <button
            key={i}
            type="button"
            className="mention-chip"
            onClick={() => onMentionClick(seg.mentionType, resolved)}
          >
            {TYPE_ICON[seg.mentionType]} {resolved.label}
          </button>
        )
      })}
    </>
  )
}
