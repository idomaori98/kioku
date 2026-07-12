import { Router } from 'express'
import Trip from '../models/Trip.js'
import Expense from '../models/Expense.js'
import { requireTripMembership } from '../middleware/tripMembership.js'

const router = Router({ mergeParams: true })
router.use(requireTripMembership)

router.get('/', async (req, res) => {
  const trip = await Trip.findById(req.params.tripId).populate('members.user', 'name')
  const expenses = await Expense.find({ trip: req.params.tripId })

  const memberCount = trip.members.length
  const totalYen = expenses.reduce((sum, e) => sum + e.amountYen, 0)
  const totalHome = expenses.reduce((sum, e) => sum + e.amountHome, 0)
  const oweYen = memberCount ? totalYen / memberCount : 0
  const oweHome = memberCount ? totalHome / memberCount : 0
  const blendedRate = totalYen > 0 ? totalHome / totalYen : 0

  const paidYen = {}
  const paidHome = {}
  for (const m of trip.members) {
    paidYen[m.user._id.toString()] = 0
    paidHome[m.user._id.toString()] = 0
  }
  for (const e of expenses) {
    const key = e.paidBy.toString()
    if (key in paidYen) {
      paidYen[key] += e.amountYen
      paidHome[key] += e.amountHome
    }
  }

  const rawBalances = trip.members.map((m) => {
    const id = m.user._id.toString()
    return {
      userId: id,
      name: m.user.name,
      netYen: paidYen[id] - oweYen,
      netHome: paidHome[id] - oweHome,
    }
  })

  const creditors = rawBalances
    .filter((b) => b.netYen > 0.5)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.netYen - a.netYen)
  const debtors = rawBalances
    .filter((b) => b.netYen < -0.5)
    .map((b) => ({ ...b, netYen: -b.netYen }))
    .sort((a, b) => b.netYen - a.netYen)

  const settlements = []
  let ci = 0
  let di = 0
  while (ci < creditors.length && di < debtors.length) {
    const c = creditors[ci]
    const d = debtors[di]
    const amount = Math.min(c.netYen, d.netYen)
    if (amount > 0.5) {
      settlements.push({
        fromUserId: d.userId,
        fromName: d.name,
        toUserId: c.userId,
        toName: c.name,
        amountYen: Math.round(amount),
        amountHome: Math.round(amount * blendedRate * 100) / 100,
      })
    }
    c.netYen -= amount
    d.netYen -= amount
    if (c.netYen <= 0.5) ci++
    if (d.netYen <= 0.5) di++
  }

  res.json({
    homeCurrency: trip.homeCurrency,
    balances: rawBalances.map((b) => ({
      userId: b.userId,
      name: b.name,
      netYen: Math.round(b.netYen),
      netHome: Math.round(b.netHome * 100) / 100,
    })),
    settlements,
  })
})

export default router
