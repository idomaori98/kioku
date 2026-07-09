import { Router } from 'express'
import Expense, { EXPENSE_CATEGORIES } from '../models/Expense.js'
import Photo from '../models/Photo.js'
import Place from '../models/Place.js'
import DayNote from '../models/DayNote.js'
import { requireTripMembership } from '../middleware/tripMembership.js'
import { tripDayKeys } from '../lib/days.js'

const router = Router({ mergeParams: true })
router.use(requireTripMembership)

router.get('/', async (req, res) => {
  const tripId = req.params.tripId
  const [expenses, photos, places, notes] = await Promise.all([
    Expense.find({ trip: tripId }),
    Photo.find({ trip: tripId }).sort({ day: 1, createdAt: 1 }).populate('addedBy', 'name'),
    Place.find({ trip: tripId }).sort({ day: 1, createdAt: 1 }).populate('addedBy', 'name'),
    DayNote.find({ trip: tripId }),
  ])

  const notesByDay = Object.fromEntries(notes.map((n) => [n.day, n.note]))
  const days = tripDayKeys(req.trip)

  const spendingByCategory = EXPENSE_CATEGORIES.map((category) => {
    const matches = expenses.filter((e) => e.category === category)
    return {
      category,
      yen: matches.reduce((sum, e) => sum + e.amountYen, 0),
      home: matches.reduce((sum, e) => sum + e.amountHome, 0),
    }
  }).filter((c) => c.yen > 0)

  const dayPages = days.map((day) => {
    const dayExpenses = expenses.filter((e) => e.day === day)
    return {
      day,
      note: notesByDay[day] || '',
      expenseYen: dayExpenses.reduce((sum, e) => sum + e.amountYen, 0),
      expenseHome: dayExpenses.reduce((sum, e) => sum + e.amountHome, 0),
      photoCount: photos.filter((p) => p.day === day).length,
      placeCount: places.filter((p) => p.day === day).length,
    }
  })

  res.json({
    totals: {
      days: days.length,
      travelers: req.trip.members.length,
      photos: photos.length,
      places: places.length,
      spendYen: expenses.reduce((sum, e) => sum + e.amountYen, 0),
      spendHome: expenses.reduce((sum, e) => sum + e.amountHome, 0),
      homeCurrency: req.trip.homeCurrency,
    },
    spendingByCategory,
    photos: photos.map((p) => ({ id: p._id, url: p.url, day: p.day })),
    places: places
      .filter((p) => p.lat != null && p.lng != null)
      .map((p) => ({ id: p._id, name: p.name, lat: p.lat, lng: p.lng, day: p.day })),
    days: dayPages,
  })
})

export default router
