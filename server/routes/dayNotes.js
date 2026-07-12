import { Router } from 'express'
import DayNote from '../models/DayNote.js'
import { requireTripMembership, requireTripNotEnded } from '../middleware/tripMembership.js'

const router = Router({ mergeParams: true })
router.use(requireTripMembership)

router.get('/', async (req, res) => {
  const { day } = req.query
  if (day) {
    const note = await DayNote.findOne({ trip: req.params.tripId, day })
    return res.json({ day, note: note?.note || '' })
  }
  const notes = await DayNote.find({ trip: req.params.tripId }).sort({ day: 1 })
  res.json(notes.map((n) => ({ day: n.day, note: n.note })))
})

router.put('/', requireTripNotEnded, async (req, res) => {
  const { day, note } = req.body
  if (!day) return res.status(400).json({ error: 'day is required' })
  const updated = await DayNote.findOneAndUpdate(
    { trip: req.params.tripId, day },
    { note: note || '', updatedBy: req.userId },
    { upsert: true, new: true }
  )
  res.json({ day: updated.day, note: updated.note })
})

export default router
