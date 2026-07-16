import { Router } from 'express'
import Notification from '../models/Notification.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

function serializeNotification(n) {
  return {
    id: n._id,
    type: n.type,
    read: n.read,
    createdAt: n.createdAt,
    actor: n.actor
      ? { id: n.actor._id, name: n.actor.name, photoUrl: n.actor.photoUrl }
      : null,
    tripId: n.trip || null,
    tripName: n.tripName || '',
  }
}

router.get('/', async (req, res) => {
  const notifications = await Notification.find({ user: req.userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('actor', 'name photoUrl')
  res.json(notifications.map(serializeNotification))
})

router.get('/unread-count', async (req, res) => {
  const count = await Notification.countDocuments({ user: req.userId, read: false })
  res.json({ count })
})

router.post('/read-all', async (req, res) => {
  await Notification.updateMany({ user: req.userId, read: false }, { read: true })
  res.json({ ok: true })
})

export default router
