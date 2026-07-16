import { Router } from 'express'
import Comment from '../models/Comment.js'
import Trip from '../models/Trip.js'
import Block from '../models/Block.js'
import { isBlockedEitherWay } from '../lib/blocks.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router({ mergeParams: true })
router.use(requireAuth)

async function requirePublishedTrip(req, res, next) {
  const trip = await Trip.findById(req.params.tripId)
  if (!trip || !trip.published) return res.status(404).json({ error: 'Trip not found' })
  req.trip = trip
  next()
}

router.use(requirePublishedTrip)

function serializeComment(c) {
  return {
    id: c._id,
    text: c.text,
    createdAt: c.createdAt,
    user: { id: c.user._id, name: c.user.name, photoUrl: c.user.photoUrl },
  }
}

router.get('/', async (req, res) => {
  const blocked = await Block.find({ blocker: req.userId })
  const blockedIds = blocked.map((b) => b.blocked)

  const comments = await Comment.find({ trip: req.params.tripId, user: { $nin: blockedIds } })
    .sort({ createdAt: 1 })
    .populate('user', 'name photoUrl')
  res.json(comments.map(serializeComment))
})

router.post('/', async (req, res) => {
  const { text } = req.body
  if (!text?.trim()) return res.status(400).json({ error: 'text is required' })

  if (await isBlockedEitherWay(req.userId, req.trip.createdBy.toString())) {
    return res.status(403).json({ error: "You can't comment on this trip" })
  }

  const comment = await Comment.create({ trip: req.params.tripId, user: req.userId, text: text.trim() })
  await comment.populate('user', 'name photoUrl')
  res.status(201).json(serializeComment(comment))
})

router.delete('/:commentId', async (req, res) => {
  const comment = await Comment.findOne({ _id: req.params.commentId, trip: req.params.tripId })
  if (!comment) return res.status(404).json({ error: 'Comment not found' })

  const isOwner = comment.user.toString() === req.userId
  const isTripCreator = req.trip.createdBy.toString() === req.userId
  if (!isOwner && !isTripCreator) {
    return res.status(403).json({ error: 'Only the comment author or trip creator can delete this' })
  }

  await comment.deleteOne()
  res.status(204).end()
})

export default router
