import { Router } from 'express'
import User from '../models/User.js'
import Block from '../models/Block.js'
import Friendship from '../models/Friendship.js'
import { requireAuth } from '../middleware/auth.js'

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
