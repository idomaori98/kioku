const JST_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

export function dayKeyFromDate(date) {
  return new Date(new Date(date).getTime() + JST_OFFSET_MS).toISOString().slice(0, 10)
}

export function japanTodayKey() {
  return dayKeyFromDate(new Date())
}

export function tripDayKeys(trip) {
  const start = dayKeyFromDate(trip.startDate)
  const end = dayKeyFromDate(trip.endDate)
  const days = []
  let cursor = new Date(`${start}T00:00:00Z`)
  const endDate = new Date(`${end}T00:00:00Z`)
  while (cursor <= endDate) {
    days.push(cursor.toISOString().slice(0, 10))
    cursor = new Date(cursor.getTime() + DAY_MS)
  }
  return days
}

export function formatDayLabel(dayKey) {
  const date = new Date(`${dayKey}T00:00:00Z`)
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
