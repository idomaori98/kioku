import Notification from '../models/Notification.js'

// Best-effort: a failed notification must never fail the request that triggered it.
export async function notify({ user, actor, type, trip = null, tripName = '' }) {
  try {
    if (!user || !actor) return
    if (user.toString() === actor.toString()) return

    // One unread DM notification per sender is enough.
    if (type === 'dm') {
      const existing = await Notification.findOne({ user, actor, type: 'dm', read: false })
      if (existing) return
    }

    await Notification.create({ user, actor, type, trip, tripName })
  } catch (err) {
    console.error('notify failed:', err.message)
  }
}
