import { Router } from 'express'
import DirectMessage from '../models/DirectMessage.js'
import Friendship from '../models/Friendship.js'
import Trip from '../models/Trip.js'
import Photo from '../models/Photo.js'
import { requireAuth } from '../middleware/auth.js'
import { isBlockedEitherWay } from '../lib/blocks.js'

const router = Router()
router.use(requireAuth)

async function requireFriendship(userA, userB) {
  return Friendship.findOne({
    status: 'accepted',
    $or: [
      { requester: userA, recipient: userB },
      { requester: userB, recipient: userA },
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
  const count = await DirectMessage.countDocuments({ recipient: req.userId, read: false })
  res.json({ count })
})

router.get('/:friendId', async (req, res) => {
  const friendship = await requireFriendship(req.userId, req.params.friendId)
  if (!friendship) return res.status(403).json({ error: 'You can only message friends' })

  await DirectMessage.updateMany(
    { sender: req.params.friendId, recipient: req.userId, read: false },
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

  const friendship = await requireFriendship(req.userId, req.params.friendId)
  if (!friendship) return res.status(403).json({ error: 'You can only message friends' })

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

export default router
