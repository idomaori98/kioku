import { Router } from 'express'
import Trip from '../models/Trip.js'
import { requireAuth } from '../middleware/auth.js'
import { dayKeyFromDate, japanTodayKey } from '../lib/days.js'
import { getJpyRate } from '../lib/exchangeRate.js'

const router = Router()
router.use(requireAuth)

function serializeTrip(trip) {
  return {
    id: trip._id,
    name: trip.name,
    startDate: trip.startDate,
    endDate: trip.endDate,
    dailyBudget: trip.dailyBudget,
    homeCurrency: trip.homeCurrency,
    tripType: trip.tripType,
    inviteToken: trip.inviteToken,
    members: trip.members.map((m) => ({
      role: m.role,
      joinedAt: m.joinedAt,
      user: { id: m.user._id, name: m.user.name, email: m.user.email, photoUrl: m.user.photoUrl },
    })),
  }
}

router.get('/', async (req, res) => {
  const trips = await Trip.find({ 'members.user': req.userId }).populate(
    'members.user',
    'name email photoUrl'
  )
  res.json(trips.map(serializeTrip))
})

router.post('/', async (req, res) => {
  const { name, startDate, endDate, dailyBudget, homeCurrency, tripType } = req.body
  if (!name?.trim() || !startDate || !endDate || !dailyBudget || !homeCurrency) {
    return res.status(400).json({
      error: 'name, startDate, endDate, dailyBudget, and homeCurrency are required',
    })
  }
  if (typeof dailyBudget !== 'number' || dailyBudget <= 0) {
    return res.status(400).json({ error: 'dailyBudget must be a positive number' })
  }
  if (tripType && !['shared', 'family'].includes(tripType)) {
    return res.status(400).json({ error: 'tripType must be "shared" or "family"' })
  }

  const startKey = dayKeyFromDate(startDate)
  const endKey = dayKeyFromDate(endDate)
  if (startKey < japanTodayKey()) {
    return res.status(400).json({ error: 'Trip start date cannot be in the past' })
  }
  if (endKey < startKey) {
    return res.status(400).json({ error: 'Trip end date cannot be before the start date' })
  }

  try {
    await getJpyRate(homeCurrency)
  } catch {
    return res.status(400).json({ error: `"${homeCurrency}" is not a recognized currency code` })
  }

  const trip = await Trip.create({
    name: name.trim(),
    startDate,
    endDate,
    dailyBudget,
    homeCurrency,
    tripType: tripType || 'shared',
    createdBy: req.userId,
    members: [{ user: req.userId, role: 'admin' }],
  })
  await trip.populate('members.user', 'name email photoUrl')

  res.status(201).json(serializeTrip(trip))
})

router.get('/:id', async (req, res) => {
  const trip = await Trip.findById(req.params.id).populate('members.user', 'name email photoUrl')
  if (!trip) return res.status(404).json({ error: 'Trip not found' })
  if (!trip.members.some((m) => m.user._id.toString() === req.userId)) {
    return res.status(403).json({ error: 'Not a member of this trip' })
  }
  res.json(serializeTrip(trip))
})

router.put('/:id', async (req, res) => {
  const { startDate, endDate, dailyBudget, homeCurrency, tripType } = req.body

  const trip = await Trip.findById(req.params.id)
  if (!trip) return res.status(404).json({ error: 'Trip not found' })

  const requester = trip.members.find((m) => m.user.toString() === req.userId)
  if (!requester || requester.role !== 'admin') {
    return res.status(403).json({ error: 'Only an admin can edit trip settings' })
  }

  const nextStartDate = startDate ?? trip.startDate
  const nextEndDate = endDate ?? trip.endDate
  if (dayKeyFromDate(nextEndDate) < dayKeyFromDate(nextStartDate)) {
    return res.status(400).json({ error: 'Trip end date cannot be before the start date' })
  }
  if (dailyBudget !== undefined && (typeof dailyBudget !== 'number' || dailyBudget <= 0)) {
    return res.status(400).json({ error: 'dailyBudget must be a positive number' })
  }
  if (tripType !== undefined && !['shared', 'family'].includes(tripType)) {
    return res.status(400).json({ error: 'tripType must be "shared" or "family"' })
  }
  if (homeCurrency !== undefined) {
    try {
      await getJpyRate(homeCurrency)
    } catch {
      return res.status(400).json({ error: `"${homeCurrency}" is not a recognized currency code` })
    }
  }

  trip.startDate = nextStartDate
  trip.endDate = nextEndDate
  if (dailyBudget !== undefined) trip.dailyBudget = dailyBudget
  if (homeCurrency !== undefined) trip.homeCurrency = homeCurrency
  if (tripType !== undefined) trip.tripType = tripType

  await trip.save()
  await trip.populate('members.user', 'name email photoUrl')
  res.json(serializeTrip(trip))
})

router.post('/join/:token', async (req, res) => {
  // Atomic: only pushes if the user isn't already a member, so two
  // concurrent join requests can't both pass a separate "already a member" check.
  const trip = await Trip.findOneAndUpdate(
    { inviteToken: req.params.token, 'members.user': { $ne: req.userId } },
    { $push: { members: { user: req.userId, role: 'member' } } },
    { new: true }
  ).populate('members.user', 'name email photoUrl')

  if (trip) return res.json(serializeTrip(trip))

  const existing = await Trip.findOne({ inviteToken: req.params.token }).populate(
    'members.user',
    'name email photoUrl'
  )
  if (!existing) return res.status(404).json({ error: 'Invite link is invalid' })
  res.json(serializeTrip(existing))
})

router.post('/:id/admins', async (req, res) => {
  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'userId is required' })

  const trip = await Trip.findById(req.params.id)
  if (!trip) return res.status(404).json({ error: 'Trip not found' })

  const requester = trip.members.find((m) => m.user.toString() === req.userId)
  if (!requester || requester.role !== 'admin') {
    return res.status(403).json({ error: 'Only an admin can grant admin rights' })
  }

  const target = trip.members.find((m) => m.user.toString() === userId)
  if (!target) return res.status(404).json({ error: 'User is not a member of this trip' })

  target.role = 'admin'
  await trip.save()
  await trip.populate('members.user', 'name email photoUrl')
  res.json(serializeTrip(trip))
})

export default router
