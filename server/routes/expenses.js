import { Router } from 'express'
import Expense, { EXPENSE_CATEGORIES } from '../models/Expense.js'
import { getJpyRate } from '../lib/exchangeRate.js'
import { requireTripMembership } from '../middleware/tripMembership.js'
import { tripDayKeys } from '../lib/days.js'

const router = Router({ mergeParams: true })
router.use(requireTripMembership)

function serializeExpense(e, tripType) {
  const base = {
    id: e._id,
    day: e.day,
    name: e.name,
    category: e.category,
    amountYen: e.amountYen,
    homeCurrency: e.homeCurrency,
    amountHome: e.amountHome,
    createdAt: e.createdAt,
  }
  if (tripType === 'family') return base
  return {
    ...base,
    paidBy: { id: e.paidBy._id, name: e.paidBy.name },
    addedBy: { id: e.addedBy._id, name: e.addedBy.name },
  }
}

router.get('/', async (req, res) => {
  const filter = { trip: req.params.tripId }
  if (req.query.day) filter.day = req.query.day
  const expenses = await Expense.find(filter).sort({ createdAt: 1 }).populate('paidBy addedBy', 'name')
  res.json(expenses.map((e) => serializeExpense(e, req.trip.tripType)))
})

router.post('/', async (req, res) => {
  const { day, name, category, amountYen, paidBy } = req.body
  if (!day || !name?.trim() || !amountYen) {
    return res.status(400).json({ error: 'day, name, and amountYen are required' })
  }
  if (typeof amountYen !== 'number' || amountYen <= 0) {
    return res.status(400).json({ error: 'amountYen must be a positive number' })
  }
  if (category && !EXPENSE_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of ${EXPENSE_CATEGORIES.join(', ')}` })
  }
  if (!tripDayKeys(req.trip).includes(day)) {
    return res.status(400).json({ error: 'day must fall within the trip dates' })
  }
  if (paidBy && req.trip.tripType !== 'family') {
    if (!req.trip.members.some((m) => m.user.toString() === paidBy)) {
      return res.status(400).json({ error: 'paidBy must be a member of this trip' })
    }
  }

  const homeCurrency = req.trip.homeCurrency
  const rate = await getJpyRate(homeCurrency)
  const expense = await Expense.create({
    trip: req.params.tripId,
    day,
    name: name.trim(),
    category: category || 'other',
    amountYen,
    homeCurrency,
    exchangeRate: rate,
    amountHome: Math.round(amountYen * rate * 100) / 100,
    paidBy: req.trip.tripType === 'family' ? req.userId : paidBy || req.userId,
    addedBy: req.userId,
  })
  await expense.populate('paidBy addedBy', 'name')
  res.status(201).json(serializeExpense(expense, req.trip.tripType))
})

export default router
