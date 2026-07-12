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

export default router
