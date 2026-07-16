import Notification from '../models/Notification.js'

// Best-effort: a failed notification must never fail the request that triggered it.
export async function notify({ user, actor, type, trip = null, tripName = '' }) {
  try {
    if (!user || !actor) return
    if (user.toString() === actor.toString()) return

    await Notification.create({ user, actor, type, trip, tripName })
  } catch (err) {
    console.error('notify failed:', err.message)
  }
}
