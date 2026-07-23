import { Router } from 'express'
import Message from '../models/Message.js'
import { requireTripMembership, requireTripNotEnded } from '../middleware/tripMembership.js'

const router = Router({ mergeParams: true })
router.use(requireTripMembership)

function serializeMessage(m) {
  return {
    id: m._id,
    text: m.text,
    sender: { id: m.sender._id, name: m.sender.name },
    createdAt: m.createdAt,
  }
}

router.get('/', async (req, res) => {
  const messages = await Message.find({ trip: req.params.tripId })
    .sort({ createdAt: 1 })
    .populate('sender', 'name')
  res.json(messages.map(serializeMessage))
})

router.post('/', requireTripNotEnded, async (req, res) => {
  const { text } = req.body
  if (!text?.trim()) return res.status(400).json({ error: 'text is required' })

  const message = await Message.create({
    trip: req.params.tripId,
    sender: req.userId,
    text: text.trim(),
  })
  await message.populate('sender', 'name')
  res.status(201).json(serializeMessage(message))
})

const DELETE_WINDOW_MS = 20 * 60 * 1000

router.delete('/:messageId', async (req, res) => {
  const msg = await Message.findOne({ _id: req.params.messageId, trip: req.params.tripId })
  if (!msg) return res.status(404).json({ error: 'Message not found' })
  if (msg.sender.toString() !== req.userId) {
    return res.status(403).json({ error: 'You can only delete your own messages' })
  }
  if (Date.now() - new Date(msg.createdAt).getTime() > DELETE_WINDOW_MS) {
    return res.status(403).json({ error: 'Messages can only be deleted within 20 minutes of sending' })
  }
  await msg.deleteOne()
  res.status(204).end()
})

export default router
