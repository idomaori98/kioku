import { Router } from 'express'
import DirectMessage from '../models/DirectMessage.js'
import Follow from '../models/Follow.js'
import Trip from '../models/Trip.js'
import Photo from '../models/Photo.js'
import { requireAuth } from '../middleware/auth.js'
import { isBlockedEitherWay } from '../lib/blocks.js'

const router = Router()
router.use(requireAuth)

// You can message someone you're connected to via follow (either direction).
async function requireConnection(userA, userB) {
  return Follow.findOne({
    $or: [
      { follower: userA, following: userB },
      { follower: userB, following: userA },
    ],
  })
}

function serializeMessage(m) {
  return {
    id: m._id,
    senderId: m.sender.toString(),
    text: m.text,
    createdAt: m.createdAt,
    sharedTrip: m.sharedTripId
      ? {
          id: m.sharedTripId,
          name: m.sharedTripName,
          destination: m.sharedTripDestination,
          coverPhotoUrl: m.sharedTripCoverUrl,
        }
      : null,
  }
}

router.get('/conversations', async (req, res) => {
  const messages = await DirectMessage.find({
    $or: [{ sender: req.userId }, { recipient: req.userId }],
  })
    .sort({ createdAt: -1 })
    .populate('sender', 'name photoUrl')
    .populate('recipient', 'name photoUrl')

  const seen = new Map()
  for (const m of messages) {
    const iAmSender = m.sender._id.toString() === req.userId
    const other = iAmSender ? m.recipient : m.sender
    const key = other._id.toString()
    if (!seen.has(key)) {
      seen.set(key, {
        user: { id: other._id, name: other.name, photoUrl: other.photoUrl },
        lastMessage: m.sharedTripId ? `Shared a trip: ${m.sharedTripName}` : m.text,
        lastMessageAt: m.createdAt,
        unreadCount: 0,
      })
    }
    if (!iAmSender && !m.read) seen.get(key).unreadCount += 1
  }

  res.json([...seen.values()])
})

router.get('/unread-count', async (req, res) => {
  // `read: { $ne: true }` also covers legacy messages saved before the read field existed.
  const count = await DirectMessage.countDocuments({ recipient: req.userId, read: { $ne: true } })
  res.json({ count })
})

router.get('/:friendId', async (req, res) => {
  const connection = await requireConnection(req.userId, req.params.friendId)
  if (!connection) return res.status(403).json({ error: 'You can only message people you follow' })

  await DirectMessage.updateMany(
    { sender: req.params.friendId, recipient: req.userId, read: { $ne: true } },
    { read: true }
  )

  const messages = await DirectMessage.find({
    $or: [
      { sender: req.userId, recipient: req.params.friendId },
      { sender: req.params.friendId, recipient: req.userId },
    ],
  }).sort({ createdAt: 1 })

  res.json(messages.map(serializeMessage))
})

router.post('/:friendId', async (req, res) => {
  const { text, sharedTripId } = req.body
  if (!text?.trim() && !sharedTripId) {
    return res.status(400).json({ error: 'text or sharedTripId is required' })
  }

  const connection = await requireConnection(req.userId, req.params.friendId)
  if (!connection) return res.status(403).json({ error: 'You can only message people you follow' })

  if (await isBlockedEitherWay(req.userId, req.params.friendId)) {
    return res.status(403).json({ error: 'Unable to message this person' })
  }

  const body = {
    sender: req.userId,
    recipient: req.params.friendId,
    text: text?.trim() || '',
  }

  if (sharedTripId) {
    const trip = await Trip.findById(sharedTripId)
    if (!trip || !trip.published) {
      return res.status(400).json({ error: 'That trip is not available to share' })
    }
    const coverPhoto = await Photo.findOne({ trip: trip._id, hiddenFromPublic: { $ne: true } }).sort({
      day: 1,
      order: 1,
      createdAt: 1,
    })
    body.sharedTripId = trip._id
    body.sharedTripName = trip.name
    body.sharedTripDestination = trip.destination || ''
    body.sharedTripCoverUrl = coverPhoto?.url || ''
  }

  const message = await DirectMessage.create(body)
  res.status(201).json(serializeMessage(message))
})

const DELETE_WINDOW_MS = 20 * 60 * 1000

router.delete('/message/:messageId', async (req, res) => {
  const msg = await DirectMessage.findById(req.params.messageId)
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
