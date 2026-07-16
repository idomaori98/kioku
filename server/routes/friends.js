import { Router } from 'express'
import Friendship from '../models/Friendship.js'
import { requireAuth } from '../middleware/auth.js'
import { isBlockedEitherWay } from '../lib/blocks.js'

const router = Router()
router.use(requireAuth)

function serializeFriendship(f, viewerId) {
  const otherMember = f.requester._id.toString() === viewerId ? f.recipient : f.requester
  return {
    id: f._id,
    status: f.status,
    incoming: f.recipient._id.toString() === viewerId,
    user: { id: otherMember._id, name: otherMember.name, photoUrl: otherMember.photoUrl },
  }
}

router.get('/', async (req, res) => {
  const friendships = await Friendship.find({
    status: 'accepted',
    $or: [{ requester: req.userId }, { recipient: req.userId }],
  })
    .populate('requester', 'name photoUrl')
    .populate('recipient', 'name photoUrl')
  res.json(friendships.map((f) => serializeFriendship(f, req.userId)))
})

router.get('/requests', async (req, res) => {
  const requests = await Friendship.find({ status: 'pending', recipient: req.userId })
    .populate('requester', 'name photoUrl')
    .populate('recipient', 'name photoUrl')
  res.json(requests.map((f) => serializeFriendship(f, req.userId)))
})

router.post('/requests', async (req, res) => {
  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'userId is required' })
  if (userId === req.userId) return res.status(400).json({ error: "You can't friend yourself" })

  if (await isBlockedEitherWay(req.userId, userId)) {
    return res.status(403).json({ error: 'Unable to send a friend request to this person' })
  }

  const existing = await Friendship.findOne({
    $or: [
      { requester: req.userId, recipient: userId },
      { requester: userId, recipient: req.userId },
    ],
  })
  if (existing) {
    return res.status(409).json({
      error: existing.status === 'accepted' ? 'Already friends' : 'A request already exists',
    })
  }

  const friendship = await Friendship.create({ requester: req.userId, recipient: userId })
  await friendship.populate('requester', 'name photoUrl')
  await friendship.populate('recipient', 'name photoUrl')
  res.status(201).json(serializeFriendship(friendship, req.userId))
})

router.post('/requests/:requesterId/accept', async (req, res) => {
  const friendship = await Friendship.findOne({
    requester: req.params.requesterId,
    recipient: req.userId,
    status: 'pending',
  })
  if (!friendship) return res.status(404).json({ error: 'Request not found' })

  friendship.status = 'accepted'
  await friendship.save()
  await friendship.populate('requester', 'name photoUrl')
  await friendship.populate('recipient', 'name photoUrl')
  res.json(serializeFriendship(friendship, req.userId))
})

router.delete('/requests/:requesterId', async (req, res) => {
  await Friendship.deleteOne({
    requester: req.params.requesterId,
    recipient: req.userId,
    status: 'pending',
  })
  res.status(204).end()
})

router.delete('/:friendId', async (req, res) => {
  await Friendship.deleteOne({
    status: 'accepted',
    $or: [
      { requester: req.userId, recipient: req.params.friendId },
      { requester: req.params.friendId, recipient: req.userId },
    ],
  })
  res.status(204).end()
})

export default router
