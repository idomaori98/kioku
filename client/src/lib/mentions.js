import { formatDayLabel } from './days'

const TOKEN_REGEX = /@\[(member|place|expense|photo):([a-f0-9]{24})\]/g

export function buildMentionCandidates({ members, places, expenses, photos }) {
  const candidates = []
  for (const m of members || []) {
    candidates.push({ type: 'member', id: m.user.id, label: m.user.name })
  }
  for (const p of places || []) {
    candidates.push({ type: 'place', id: p.id, label: p.name })
  }
  for (const e of expenses || []) {
    candidates.push({ type: 'expense', id: e.id, label: e.name })
  }
  for (const p of photos || []) {
    candidates.push({
      type: 'photo',
      id: p.id,
      label: p.note || `Photo — ${formatDayLabel(p.day)}`,
    })
  }
  return candidates
}

// Finds the @query the user is actively typing at the cursor, if any.
// A range already covered by a confirmed mention doesn't count as active.
export function findActiveQuery(text, mentionRanges, cursorPos) {
  const withinMention = (mentionRanges || []).some((r) => cursorPos > r.start && cursorPos <= r.end)
  if (withinMention) return null

  let atIndex = -1
  for (let i = cursorPos - 1; i >= 0; i--) {
    const ch = text[i]
    if (ch === '@') {
      atIndex = i
      break
    }
    if (/\s/.test(ch)) break
  }
  if (atIndex === -1) return null
  if (atIndex > 0 && !/\s/.test(text[atIndex - 1])) return null

  return { atIndex, query: text.slice(atIndex + 1, cursorPos) }
}

// Re-derives mention ranges after a text edit by diffing old vs new text.
// Mentions untouched by the edit shift with it; mentions the edit overlaps
// are dropped (revert to plain text) rather than risk a corrupted token.
export function reconcileMentions(oldText, oldMentions, newText) {
  let prefixLen = 0
  const maxPrefix = Math.min(oldText.length, newText.length)
  while (prefixLen < maxPrefix && oldText[prefixLen] === newText[prefixLen]) prefixLen++

  let suffixLen = 0
  const maxSuffix = Math.min(oldText.length, newText.length) - prefixLen
  while (
    suffixLen < maxSuffix &&
    oldText[oldText.length - 1 - suffixLen] === newText[newText.length - 1 - suffixLen]
  ) {
    suffixLen++
  }

  const oldChangeEnd = oldText.length - suffixLen
  const delta = newText.length - oldText.length

  const next = []
  for (const r of oldMentions) {
    if (r.end <= prefixLen) {
      next.push(r)
    } else if (r.start >= oldChangeEnd) {
      next.push({ ...r, start: r.start + delta, end: r.end + delta })
    }
    // else: the edit overlaps this mention's range — drop it.
  }
  return next
}

export function insertMention(text, mentions, atIndex, cursorPos, candidate) {
  const inserted = `@${candidate.label} `
  const nextText = text.slice(0, atIndex) + inserted + text.slice(cursorPos)
  const delta = inserted.length - (cursorPos - atIndex)

  const shifted = mentions
    .filter((r) => r.end <= atIndex)
    .concat(mentions.filter((r) => r.start >= cursorPos).map((r) => ({ ...r, start: r.start + delta, end: r.end + delta })))

  const newRange = {
    start: atIndex,
    end: atIndex + 1 + candidate.label.length,
    type: candidate.type,
    id: candidate.id,
  }
  shifted.push(newRange)
  shifted.sort((a, b) => a.start - b.start)

  return { text: nextText, mentions: shifted, cursorPos: newRange.end + 1 }
}

export function serializeForSend(text, mentions) {
  const sorted = [...mentions].sort((a, b) => a.start - b.start)
  let result = ''
  let cursor = 0
  for (const r of sorted) {
    result += text.slice(cursor, r.start)
    result += `@[${r.type}:${r.id}]`
    cursor = r.end
  }
  result += text.slice(cursor)
  return result
}

export function parseMessageText(text) {
  const segments = []
  let lastIndex = 0
  let match
  TOKEN_REGEX.lastIndex = 0
  while ((match = TOKEN_REGEX.exec(text))) {
    if (match.index > lastIndex) {
      segments.push({ kind: 'text', value: text.slice(lastIndex, match.index) })
    }
    segments.push({ kind: 'mention', mentionType: match[1], id: match[2] })
    lastIndex = TOKEN_REGEX.lastIndex
  }
  if (lastIndex < text.length) {
    segments.push({ kind: 'text', value: text.slice(lastIndex) })
  }
  return segments
}
