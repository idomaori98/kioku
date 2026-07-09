import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { OAuth2Client } from 'google-auth-library'
import User from '../models/User.js'
import { signToken, requireAuth } from '../middleware/auth.js'
import { createUploadUrl } from '../lib/s3.js'

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png']

const router = Router()
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body
  if (!email || !password || !name?.trim()) {
    return res.status(400).json({ error: 'email, password, and name are required' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) return res.status(409).json({ error: 'Email already in use' })

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.create({ email, passwordHash, name: name.trim() })

  res.status(201).json({
    token: signToken(user),
    user: { id: user._id, email: user.email, name: user.name, photoUrl: user.photoUrl },
  })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' })
  }

  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' })

  res.json({
    token: signToken(user),
    user: { id: user._id, email: user.email, name: user.name, photoUrl: user.photoUrl },
  })
})

router.post('/google', async (req, res) => {
  const { idToken } = req.body
  if (!idToken) return res.status(400).json({ error: 'idToken is required' })

  let payload
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    payload = ticket.getPayload()
  } catch {
    return res.status(401).json({ error: 'Invalid Google token' })
  }

  const { sub: googleId, email, name, picture } = payload

  let user = await User.findOne({ googleId })
  if (!user) {
    user = await User.findOne({ email: email.toLowerCase() })
    if (user) {
      user.googleId = googleId
      await user.save()
    } else {
      user = await User.create({ email, googleId, name, photoUrl: picture || '' })
    }
  }

  res.json({
    token: signToken(user),
    user: { id: user._id, email: user.email, name: user.name, photoUrl: user.photoUrl },
  })
})

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json({ id: user._id, email: user.email, name: user.name, photoUrl: user.photoUrl })
})

router.post('/me/photo-upload-url', requireAuth, async (req, res) => {
  const { contentType } = req.body
  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    return res.status(400).json({ error: 'contentType must be image/jpeg or image/png' })
  }
  const { uploadUrl, publicUrl } = await createUploadUrl(`users/${req.userId}`, contentType)
  res.json({ uploadUrl, publicUrl })
})

router.put('/me', requireAuth, async (req, res) => {
  const { photoUrl } = req.body
  const user = await User.findById(req.userId)
  if (!user) return res.status(404).json({ error: 'User not found' })

  if (photoUrl !== undefined) user.photoUrl = photoUrl
  await user.save()
  res.json({ id: user._id, email: user.email, name: user.name, photoUrl: user.photoUrl })
})

export default router
