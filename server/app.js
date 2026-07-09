import express from 'express'
import { connectDB, dbStatus } from './db.js'
import authRoutes from './routes/auth.js'
import tripRoutes from './routes/trips.js'
import expenseRoutes from './routes/expenses.js'
import dayNoteRoutes from './routes/dayNotes.js'
import photoRoutes from './routes/photos.js'
import placeRoutes from './routes/places.js'
import { requireAuth } from './middleware/auth.js'

const app = express()

app.use(express.json())

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

export default app
