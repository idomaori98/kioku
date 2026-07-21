import { Router } from 'express'
import User from '../models/User.js'
import Block from '../models/Block.js'
import Friendship from '../models/Friendship.js'
import Follow from '../models/Follow.js'
import Trip from '../models/Trip.js'
import { requireAuth } from '../middleware/auth.js'
import { isBlockedEitherWay } from '../lib/blocks.js'
import { notify } from '../lib/notify.js'
import { attachCardData } from './trips.js'

const router = Router()
router.use(requireAuth)

router.get('/find', async (req, res) => {
  const { email } = req.query
  if (!email?.trim()) return res.status(400).json({ error: 'email is required' })

  const user = await User.findOne({ email: email.trim().toLowerCase() })
  if (!user) return res.status(404).json({ error: 'No user found with that email' })
  if (user._id.toString() === req.userId) {
    return res.status(400).json({ error: "That's your own email" })
  }

  res.json({ id: user._id, name: user.name, photoUrl: user.photoUrl })
})

// Search people by name (for discovery). Excludes self and anyone blocked either way.
router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim()
  if (!q) return res.json([])

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const blocks = await Block.find({ $or: [{ blocker: req.userId }, { blocked: req.userId }] })
  const blockedIds = new Set(blocks.flatMap((b) => [b.blocker.toString(), b.blocked.toString()]))
  blockedIds.add(req.userId)

  const users = await User.find({ name: new RegExp(escaped, 'i') }, 'name photoUrl').limit(30)
  res.json(
    users
      .filter((u) => !blockedIds.has(u._id.toString()))
      .slice(0, 20)
      .map((u) => ({ id: u._id, name: u.name, photoUrl: u.photoUrl }))
  )
})

router.post('/:id/follow', async (req, res) => {
  if (req.params.id === req.userId) return res.status(400).json({ error: "You can't follow yourself" })
  const target = await User.findById(req.params.id)
  if (!target) return res.status(404).json({ error: 'User not found' })
  if (await isBlockedEitherWay(req.userId, req.params.id)) {
    return res.status(403).json({ error: 'Unable to follow this person' })
  }

  const result = await Follow.updateOne(
    { follower: req.userId, following: req.params.id },
    { follower: req.userId, following: req.params.id },
    { upsert: true }
  )
  if (result.upsertedCount > 0) {
    await notify({ user: req.params.id, actor: req.userId, type: 'follow' })
  }
  res.status(204).end()
})

router.delete('/:id/follow', async (req, res) => {
  await Follow.deleteOne({ follower: req.userId, following: req.params.id })
  res.status(204).end()
})

router.get('/:id/followers', async (req, res) => {
  const follows = await Follow.find({ following: req.params.id }).populate('follower', 'name photoUrl')
  res.json(follows.map((f) => ({ id: f.follower._id, name: f.follower.name, photoUrl: f.follower.photoUrl })))
})

router.get('/:id/following', async (req, res) => {
  const follows = await Follow.find({ follower: req.params.id }).populate('following', 'name photoUrl')
  res.json(follows.map((f) => ({ id: f.following._id, name: f.following.name, photoUrl: f.following.photoUrl })))
})

// Public profile: user, follow counts/status, and their published trips.
router.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id, 'name photoUrl')
  if (!user) return res.status(404).json({ error: 'User not found' })

  const [followerCount, followingCount, myFollow, trips] = await Promise.all([
    Follow.countDocuments({ following: user._id }),
    Follow.countDocuments({ follower: user._id }),
    Follow.findOne({ follower: req.userId, following: user._id }),
    Trip.find({ createdBy: user._id, published: true }).sort({ publishedAt: -1 }),
  ])
  const cards = await attachCardData(trips, req.userId)

  res.json({
    id: user._id,
    name: user.name,
    photoUrl: user.photoUrl,
    isMe: user._id.toString() === req.userId,
    isFollowedByMe: !!myFollow,
    followerCount,
    followingCount,
    tripCount: cards.length,
    trips: cards,
  })
})

router.post('/:id/block', async (req, res) => {
  if (req.params.id === req.userId) {
    return res.status(400).json({ error: "You can't block yourself" })
  }
  const target = await User.findById(req.params.id)
  if (!target) return res.status(404).json({ error: 'User not found' })

  await Block.updateOne(
    { blocker: req.userId, blocked: req.params.id },
    { blocker: req.userId, blocked: req.params.id },
    { upsert: true }
  )
  // Blocking ends any existing friendship between the two, either direction.
  await Friendship.deleteMany({
    $or: [
      { requester: req.userId, recipient: req.params.id },
      { requester: req.params.id, recipient: req.userId },
    ],
  })

  res.status(204).end()
})

router.delete('/:id/block', async (req, res) => {
  await Block.deleteOne({ blocker: req.userId, blocked: req.params.id })
  res.status(204).end()
})

export default router
