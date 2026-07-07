import express from 'express'
import { connectDB, dbStatus } from './db.js'

const app = express()

app.get('/api/health', async (req, res) => {
  let db = 'not configured'
  if (process.env.MONGODB_URI) {
    try {
      await connectDB()
      db = dbStatus()
    } catch (err) {
      db = `error: ${err.message}`
    }
  }
  res.json({ ok: true, db })
})

export default app
