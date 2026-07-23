// Ported from client/src/lib/mentions.js — same token format so web + mobile
// chats interoperate: @[member|place|expense|photo:<24-hex-id>].
import type { Trip, PublicTrip } from './api'

export type MentionType = 'member' | 'place' | 'expense' | 'photo'
export type Candidate = { type: MentionType; id: string; label: string }
export type MentionRange = { start: number; end: number; type: MentionType; id: string }
export type Segment = { kind: 'text'; value: string } | { kind: 'mention'; mentionType: MentionType; id: string }

const TOKEN_REGEX = /@\[(member|place|expense|photo):([a-f0-9]{24})\]/g

function formatDayLabel(dayKey: string) {
  return new Date(`${dayKey}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

// Build the @-mention candidate list from a trip's members + its itinerary.
export function buildCandidates(members: Trip['members'], itinerary: PublicTrip): Candidate[] {
  const candidates: Candidate[] = []
  for (const m of members) candidates.push({ type: 'member', id: m.user.id, label: m.user.name })
  for (const day of itinerary.days) {
    for (const p of day.places) candidates.push({ type: 'place', id: p.id, label: p.name })
    for (const e of day.expenses) candidates.push({ type: 'expense', id: e.id, label: e.name })
    for (const p of day.photos)
      candidates.push({ type: 'photo', id: p.id, label: p.note || `Photo — ${formatDayLabel(day.day)}` })
  }
  return candidates
}

export function findActiveQuery(text: string, mentionRanges: MentionRange[], cursorPos: number) {
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

export function reconcileMentions(oldText: string, oldMentions: MentionRange[], newText: string): MentionRange[] {
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

  const next: MentionRange[] = []
  for (const r of oldMentions) {
    if (r.end <= prefixLen) next.push(r)
    else if (r.start >= oldChangeEnd) next.push({ ...r, start: r.start + delta, end: r.end + delta })
    // else: the edit overlaps this mention — drop it (revert to plain text).
  }
  return next
}

export function insertMention(
  text: string,
  mentions: MentionRange[],
  atIndex: number,
  cursorPos: number,
  candidate: Candidate
) {
  const inserted = `@${candidate.label} `
  const nextText = text.slice(0, atIndex) + inserted + text.slice(cursorPos)
  const delta = inserted.length - (cursorPos - atIndex)

  const shifted = mentions
    .filter((r) => r.end <= atIndex)
    .concat(
      mentions
        .filter((r) => r.start >= cursorPos)
        .map((r) => ({ ...r, start: r.start + delta, end: r.end + delta }))
    )

  const newRange: MentionRange = {
    start: atIndex,
    end: atIndex + 1 + candidate.label.length,
    type: candidate.type,
    id: candidate.id,
  }
  shifted.push(newRange)
  shifted.sort((a, b) => a.start - b.start)

  return { text: nextText, mentions: shifted, cursorPos: newRange.end + 1 }
}

export function serializeForSend(text: string, mentions: MentionRange[]) {
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

export function parseMessageText(text: string): Segment[] {
  const segments: Segment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  TOKEN_REGEX.lastIndex = 0
  while ((match = TOKEN_REGEX.exec(text))) {
    if (match.index > lastIndex) segments.push({ kind: 'text', value: text.slice(lastIndex, match.index) })
    segments.push({ kind: 'mention', mentionType: match[1] as MentionType, id: match[2] })
    lastIndex = TOKEN_REGEX.lastIndex
  }
  if (lastIndex < text.length) segments.push({ kind: 'text', value: text.slice(lastIndex) })
  return segments
}
