import { Router } from 'express'
import Expense, { EXPENSE_CATEGORIES } from '../models/Expense.js'
import { getJpyRate } from '../lib/exchangeRate.js'
import { requireTripMembership, requireTripNotEnded } from '../middleware/tripMembership.js'
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

router.post('/', requireTripNotEnded, async (req, res) => {
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

router.put('/:expenseId', requireTripNotEnded, async (req, res) => {
  const { day, name, category, amountYen, paidBy } = req.body
  const expense = await Expense.findOne({ _id: req.params.expenseId, trip: req.params.tripId })
  if (!expense) return res.status(404).json({ error: 'Expense not found' })

  if (day !== undefined && !tripDayKeys(req.trip).includes(day)) {
    return res.status(400).json({ error: 'day must fall within the trip dates' })
  }
  if (amountYen !== undefined && (typeof amountYen !== 'number' || amountYen <= 0)) {
    return res.status(400).json({ error: 'amountYen must be a positive number' })
  }
  if (category !== undefined && !EXPENSE_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of ${EXPENSE_CATEGORIES.join(', ')}` })
  }
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: 'name cannot be blank' })
  }
  if (paidBy && req.trip.tripType !== 'family') {
    if (!req.trip.members.some((m) => m.user.toString() === paidBy)) {
      return res.status(400).json({ error: 'paidBy must be a member of this trip' })
    }
  }

  if (day !== undefined) expense.day = day
  if (name !== undefined) expense.name = name.trim()
  if (category !== undefined) expense.category = category
  if (amountYen !== undefined) {
    expense.amountYen = amountYen
    expense.amountHome = Math.round(amountYen * expense.exchangeRate * 100) / 100
  }
  if (paidBy !== undefined && req.trip.tripType !== 'family') expense.paidBy = paidBy

  await expense.save()
  await expense.populate('paidBy addedBy', 'name')
  res.json(serializeExpense(expense, req.trip.tripType))
})

router.delete('/:expenseId', requireTripNotEnded, async (req, res) => {
  const expense = await Expense.findOneAndDelete({ _id: req.params.expenseId, trip: req.params.tripId })
  if (!expense) return res.status(404).json({ error: 'Expense not found' })
  res.status(204).end()
})

export default router
