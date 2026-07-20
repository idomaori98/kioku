import express from 'express'
import { connectDB, dbStatus } from './db.js'
import authRoutes from './routes/auth.js'
import tripRoutes from './routes/trips.js'
import expenseRoutes from './routes/expenses.js'
import dayNoteRoutes from './routes/dayNotes.js'
import photoRoutes from './routes/photos.js'
import placeRoutes from './routes/places.js'
import recapRoutes from './routes/recap.js'
import messageRoutes from './routes/messages.js'
import balanceRoutes from './routes/balances.js'
import commentRoutes from './routes/comments.js'
import userRoutes from './routes/users.js'
import friendRoutes from './routes/friends.js'
import directMessageRoutes from './routes/directMessages.js'
import reportRoutes from './routes/reports.js'
import notificationRoutes from './routes/notifications.js'
import adminRoutes from './routes/admin.js'
import { requireAuth } from './middleware/auth.js'

const app = express()

app.use(express.json())

// CORS — the API is consumed by native mobile clients (no Origin enforcement)
// and, in dev, by Expo's web preview + the marketing site (browser, cross-origin).
// Safe to allow any origin because auth is Bearer-token, not cookies (no credentials).
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

app.use(async (req, res, next) => {
  if (!process.env.MONGODB_URI) return next()
  try {
    await connectDB()
    next()
  } catch (err) {
    res.status(503).json({ error: `Database unavailable: ${err.message}` })
  }
})

app.get('/api/health', (req, res) => {
  res.json({ ok: true, db: process.env.MONGODB_URI ? dbStatus() : 'not configured' })
})

app.use('/api/auth', authRoutes)
app.use('/api/trips', tripRoutes)
app.use('/api/trips/:tripId/expenses', requireAuth, expenseRoutes)
app.use('/api/trips/:tripId/day-note', requireAuth, dayNoteRoutes)
app.use('/api/trips/:tripId/photos', requireAuth, photoRoutes)
app.use('/api/trips/:tripId/places', requireAuth, placeRoutes)
app.use('/api/trips/:tripId/recap', requireAuth, recapRoutes)
app.use('/api/trips/:tripId/messages', requireAuth, messageRoutes)
app.use('/api/trips/:tripId/balances', requireAuth, balanceRoutes)
app.use('/api/trips/:tripId/comments', requireAuth, commentRoutes)
app.use('/api/users', userRoutes)
app.use('/api/friends', friendRoutes)
app.use('/api/dm', directMessageRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/admin', adminRoutes)

export default app
