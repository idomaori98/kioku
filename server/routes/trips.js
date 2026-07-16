import { Router } from 'express'
import Trip, { TRAVEL_TYPES } from '../models/Trip.js'
import Like from '../models/Like.js'
import Favorite from '../models/Favorite.js'
import Comment from '../models/Comment.js'
import Expense from '../models/Expense.js'
import Place from '../models/Place.js'
import Photo from '../models/Photo.js'
import DayNote from '../models/DayNote.js'
import Message from '../models/Message.js'
import { requireAuth } from '../middleware/auth.js'
import { dayKeyFromDate, japanTodayKey, tripDayKeys } from '../lib/days.js'
import { getJpyRate } from '../lib/exchangeRate.js'
import { deleteObject } from '../lib/s3.js'
import { notify } from '../lib/notify.js'

const router = Router()
router.use(requireAuth)

function serializeTrip(trip) {
  const creatorMember = trip.members.find((m) => m.user._id.toString() === trip.createdBy.toString())
  return {
    id: trip._id,
    name: trip.name,
    startDate: trip.startDate,
    endDate: trip.endDate,
    dailyBudget: trip.dailyBudget,
    homeCurrency: trip.homeCurrency,
    tripType: trip.tripType,
    destination: trip.destination || '',
    travelType: trip.travelType,
    inviteToken: trip.inviteToken,
    createdBy: trip.createdBy,
    createdByName: creatorMember?.user.name || null,
    endedAt: trip.endedAt || null,
    published: trip.published || false,
    publishedAt: trip.publishedAt || null,
    copiedFromName: trip.copiedFromName || '',
    copiedFromCreatorName: trip.copiedFromCreatorName || '',
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
  const { name, startDate, endDate, dailyBudget, homeCurrency, tripType, destination, travelType } =
    req.body
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
  if (travelType && !TRAVEL_TYPES.includes(travelType)) {
    return res.status(400).json({ error: `travelType must be one of ${TRAVEL_TYPES.join(', ')}` })
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
    destination: destination?.trim() || '',
    travelType: travelType || 'family',
    createdBy: req.userId,
    members: [{ user: req.userId, role: 'admin' }],
  })
  await trip.populate('members.user', 'name email photoUrl')

  res.status(201).json(serializeTrip(trip))
})

async function attachCardData(trips, userId) {
  const tripIds = trips.map((t) => t._id)
  const [coverPhotos, likeCounts, myLikes, myFavorites] = await Promise.all([
    Photo.aggregate([
      { $match: { trip: { $in: tripIds }, hiddenFromPublic: { $ne: true } } },
      { $sort: { day: 1, order: 1, createdAt: 1 } },
      { $group: { _id: '$trip', url: { $first: '$url' } } },
    ]),
    Like.aggregate([
      { $match: { trip: { $in: tripIds } } },
      { $group: { _id: '$trip', count: { $sum: 1 } } },
    ]),
    Like.find({ trip: { $in: tripIds }, user: userId }),
    Favorite.find({ trip: { $in: tripIds }, user: userId }),
  ])
  const coverByTrip = Object.fromEntries(coverPhotos.map((c) => [c._id.toString(), c.url]))
  const likesByTrip = Object.fromEntries(likeCounts.map((c) => [c._id.toString(), c.count]))
  const likedSet = new Set(myLikes.map((l) => l.trip.toString()))
  const favoritedSet = new Set(myFavorites.map((f) => f.trip.toString()))

  return trips.map((trip) => ({
    id: trip._id,
    name: trip.name,
    destination: trip.destination || '',
    travelType: trip.travelType,
    days: tripDayKeys(trip).length,
    dailyBudget: trip.dailyBudget,
    homeCurrency: trip.homeCurrency,
    coverPhotoUrl: coverByTrip[trip._id.toString()] || null,
    likesCount: likesByTrip[trip._id.toString()] || 0,
    likedByMe: likedSet.has(trip._id.toString()),
    favoritedByMe: favoritedSet.has(trip._id.toString()),
    publishedAt: trip.publishedAt,
  }))
}

router.get('/feed', async (req, res) => {
  const trips = await Trip.find({ published: true })
  const cards = await attachCardData(trips, req.userId)
  cards.sort(
    (a, b) => b.likesCount - a.likesCount || new Date(b.publishedAt) - new Date(a.publishedAt)
  )
  res.json(cards)
})

router.get('/search', async (req, res) => {
  const { q, travelType, minBudget, maxBudget, minLength, maxLength } = req.query
  const filter = { published: true }
  if (travelType) filter.travelType = travelType
  if (q?.trim()) {
    const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'i')
    filter.$or = [{ destination: regex }, { name: regex }]
  }

  const trips = await Trip.find(filter)
  let cards = await attachCardData(trips, req.userId)

  const min = minBudget !== undefined ? Number(minBudget) : null
  const max = maxBudget !== undefined ? Number(maxBudget) : null
  const minLen = minLength !== undefined ? Number(minLength) : null
  const maxLen = maxLength !== undefined ? Number(maxLength) : null

  cards = cards.filter((c) => {
    const totalBudget = c.dailyBudget * c.days
    if (min !== null && totalBudget < min) return false
    if (max !== null && totalBudget > max) return false
    if (minLen !== null && c.days < minLen) return false
    if (maxLen !== null && c.days > maxLen) return false
    return true
  })

  cards.sort((a, b) => b.likesCount - a.likesCount)
  res.json(cards)
})

router.get('/favorites', async (req, res) => {
  const favorites = await Favorite.find({ user: req.userId }).sort({ createdAt: -1 })
  const trips = await Trip.find({ _id: { $in: favorites.map((f) => f.trip) }, published: true })
  const cards = await attachCardData(trips, req.userId)
  const order = favorites.map((f) => f.trip.toString())
  cards.sort((a, b) => order.indexOf(a.id.toString()) - order.indexOf(b.id.toString()))
  res.json(cards)
})

router.get('/:id', async (req, res) => {
  const trip = await Trip.findById(req.params.id).populate('members.user', 'name email photoUrl')
  if (!trip) return res.status(404).json({ error: 'Trip not found' })
  if (!trip.members.some((m) => m.user._id.toString() === req.userId)) {
    return res.status(403).json({ error: 'Not a member of this trip' })
  }
  res.json(serializeTrip(trip))
})

router.post('/:id/like', async (req, res) => {
  const trip = await Trip.findById(req.params.id)
  if (!trip || !trip.published) return res.status(404).json({ error: 'Trip not found' })

  const result = await Like.updateOne(
    { trip: trip._id, user: req.userId },
    { trip: trip._id, user: req.userId },
    { upsert: true }
  )
  if (result.upsertedCount > 0) {
    await notify({
      user: trip.createdBy,
      actor: req.userId,
      type: 'like',
      trip: trip._id,
      tripName: trip.name,
    })
  }
  const likesCount = await Like.countDocuments({ trip: trip._id })
  res.json({ likesCount, likedByMe: true })
})

router.delete('/:id/like', async (req, res) => {
  const trip = await Trip.findById(req.params.id)
  if (!trip) return res.status(404).json({ error: 'Trip not found' })

  await Like.deleteOne({ trip: trip._id, user: req.userId })
  const likesCount = await Like.countDocuments({ trip: trip._id })
  res.json({ likesCount, likedByMe: false })
})

router.post('/:id/favorite', async (req, res) => {
  const trip = await Trip.findById(req.params.id)
  if (!trip || !trip.published) return res.status(404).json({ error: 'Trip not found' })

  await Favorite.updateOne(
    { trip: trip._id, user: req.userId },
    { trip: trip._id, user: req.userId },
    { upsert: true }
  )
  res.json({ favoritedByMe: true })
})

router.delete('/:id/favorite', async (req, res) => {
  await Favorite.deleteOne({ trip: req.params.id, user: req.userId })
  res.json({ favoritedByMe: false })
})

router.put('/:id', async (req, res) => {
  const { startDate, endDate, dailyBudget, homeCurrency, tripType, destination, travelType } = req.body

  const trip = await Trip.findById(req.params.id)
  if (!trip) return res.status(404).json({ error: 'Trip not found' })

  const requester = trip.members.find((m) => m.user.toString() === req.userId)
  if (!requester || requester.role !== 'admin') {
    return res.status(403).json({ error: 'Only an admin can edit trip settings' })
  }
  if (trip.endedAt) {
    return res.status(403).json({ error: 'This trip has ended and is now read-only.' })
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
  if (travelType !== undefined && !TRAVEL_TYPES.includes(travelType)) {
    return res.status(400).json({ error: `travelType must be one of ${TRAVEL_TYPES.join(', ')}` })
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
  if (destination !== undefined) trip.destination = destination.trim()
  if (travelType !== undefined) trip.travelType = travelType

  await trip.save()
  await trip.populate('members.user', 'name email photoUrl')
  res.json(serializeTrip(trip))
})

router.delete('/:id', async (req, res) => {
  const trip = await Trip.findById(req.params.id)
  if (!trip) return res.status(404).json({ error: 'Trip not found' })
  if (trip.createdBy.toString() !== req.userId) {
    return res.status(403).json({ error: 'Only the person who created this trip can delete it' })
  }

  const photos = await Photo.find({ trip: trip._id })
  await Promise.all(photos.map((p) => deleteObject(p.key).catch(() => {})))

  await Promise.all([
    Expense.deleteMany({ trip: trip._id }),
    Place.deleteMany({ trip: trip._id }),
    Photo.deleteMany({ trip: trip._id }),
    DayNote.deleteMany({ trip: trip._id }),
    Message.deleteMany({ trip: trip._id }),
    Like.deleteMany({ trip: trip._id }),
    Favorite.deleteMany({ trip: trip._id }),
    Comment.deleteMany({ trip: trip._id }),
  ])
  await trip.deleteOne()

  res.status(204).end()
})

router.post('/:id/end', async (req, res) => {
  const trip = await Trip.findById(req.params.id)
  if (!trip) return res.status(404).json({ error: 'Trip not found' })
  if (trip.createdBy.toString() !== req.userId) {
    return res.status(403).json({ error: 'Only the person who created this trip can end it' })
  }

  trip.endedAt = new Date()
  await trip.save()
  await trip.populate('members.user', 'name email photoUrl')
  res.json(serializeTrip(trip))
})

router.post('/:id/publish', async (req, res) => {
  const trip = await Trip.findById(req.params.id)
  if (!trip) return res.status(404).json({ error: 'Trip not found' })
  if (trip.createdBy.toString() !== req.userId) {
    return res.status(403).json({ error: 'Only the person who created this trip can publish it' })
  }

  trip.published = true
  trip.publishedAt = new Date()
  await trip.save()
  await trip.populate('members.user', 'name email photoUrl')
  res.json(serializeTrip(trip))
})

router.post('/:id/unpublish', async (req, res) => {
  const trip = await Trip.findById(req.params.id)
  if (!trip) return res.status(404).json({ error: 'Trip not found' })
  if (trip.createdBy.toString() !== req.userId) {
    return res.status(403).json({ error: 'Only the person who created this trip can unpublish it' })
  }

  trip.published = false
  await trip.save()
  await trip.populate('members.user', 'name email photoUrl')
  res.json(serializeTrip(trip))
})

router.put('/:id/publication', async (req, res) => {
  const trip = await Trip.findById(req.params.id)
  if (!trip) return res.status(404).json({ error: 'Trip not found' })
  if (trip.createdBy.toString() !== req.userId) {
    return res.status(403).json({ error: 'Only the person who created this trip can edit publication' })
  }

  const { hiddenExpenseIds, hiddenPhotoIds } = req.body
  if (!Array.isArray(hiddenExpenseIds) || !Array.isArray(hiddenPhotoIds)) {
    return res.status(400).json({ error: 'hiddenExpenseIds and hiddenPhotoIds must be arrays' })
  }

  // Each pair must run in order (reset before re-hiding) since both target
  // the same collection — Promise.all would race the two writes.
  await Promise.all([
    Expense.updateMany({ trip: trip._id }, { hiddenFromPublic: false }).then(() =>
      Expense.updateMany(
        { trip: trip._id, _id: { $in: hiddenExpenseIds } },
        { hiddenFromPublic: true }
      )
    ),
    Photo.updateMany({ trip: trip._id }, { hiddenFromPublic: false }).then(() =>
      Photo.updateMany({ trip: trip._id, _id: { $in: hiddenPhotoIds } }, { hiddenFromPublic: true })
    ),
  ])

  res.status(204).end()
})

router.get('/:id/public', async (req, res) => {
  const trip = await Trip.findById(req.params.id).populate('members.user', 'name')
  if (!trip || !trip.published) return res.status(404).json({ error: 'Trip not found' })

  const creatorMember = trip.members.find((m) => m.user._id.toString() === trip.createdBy.toString())

  const [expenses, places, photos, notes] = await Promise.all([
    Expense.find({ trip: trip._id, hiddenFromPublic: { $ne: true } }).populate('addedBy', 'name'),
    Place.find({ trip: trip._id }).populate('addedBy', 'name'),
    Photo.find({ trip: trip._id, hiddenFromPublic: { $ne: true } })
      .sort({ day: 1, order: 1, createdAt: 1 })
      .populate('addedBy', 'name'),
    DayNote.find({ trip: trip._id }),
  ])

  const notesByDay = Object.fromEntries(notes.map((n) => [n.day, n.note]))
  const days = tripDayKeys(trip)
  const [likesCount, myLike, myFavorite] = await Promise.all([
    Like.countDocuments({ trip: trip._id }),
    Like.findOne({ trip: trip._id, user: req.userId }),
    Favorite.findOne({ trip: trip._id, user: req.userId }),
  ])

  const dayPages = days.map((day) => ({
    day,
    note: notesByDay[day] || '',
    places: places
      .filter((p) => p.day === day)
      .map((p) => ({
        id: p._id,
        name: p.name,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        addedByName: p.addedBy.name,
      })),
    expenses: expenses
      .filter((e) => e.day === day)
      .map((e) => ({
        id: e._id,
        name: e.name,
        category: e.category,
        amountYen: e.amountYen,
        amountHome: e.amountHome,
        addedByName: e.addedBy.name,
      })),
    photos: photos
      .filter((p) => p.day === day)
      .map((p) => ({ id: p._id, url: p.url, note: p.note, addedByName: p.addedBy.name })),
  }))

  res.json({
    id: trip._id,
    name: trip.name,
    startDate: trip.startDate,
    endDate: trip.endDate,
    dailyBudget: trip.dailyBudget,
    homeCurrency: trip.homeCurrency,
    tripType: trip.tripType,
    destination: trip.destination || '',
    travelType: trip.travelType,
    createdBy: trip.createdBy,
    createdByName: creatorMember?.user.name || null,
    publishedAt: trip.publishedAt,
    likesCount,
    likedByMe: !!myLike,
    favoritedByMe: !!myFavorite,
    stats: {
      days: days.length,
      travelers: trip.members.length,
      photos: photos.length,
      places: places.length,
      spendYen: expenses.reduce((sum, e) => sum + e.amountYen, 0),
      spendHome: expenses.reduce((sum, e) => sum + e.amountHome, 0),
    },
    days: dayPages,
  })
})

router.post('/:id/copy', async (req, res) => {
  const { startDate, endDate } = req.body
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' })
  }

  const original = await Trip.findById(req.params.id).populate('members.user', 'name')
  if (!original || !original.published) {
    return res.status(404).json({ error: 'Trip not found' })
  }

  const startKey = dayKeyFromDate(startDate)
  const endKey = dayKeyFromDate(endDate)
  if (startKey < japanTodayKey()) {
    return res.status(400).json({ error: 'Trip start date cannot be in the past' })
  }
  if (endKey < startKey) {
    return res.status(400).json({ error: 'Trip end date cannot be before the start date' })
  }

  const creatorMember = original.members.find(
    (m) => m.user._id.toString() === original.createdBy.toString()
  )

  const copy = await Trip.create({
    name: `${original.name} (copy)`,
    destination: original.destination,
    startDate,
    endDate,
    dailyBudget: original.dailyBudget,
    homeCurrency: original.homeCurrency,
    tripType: original.tripType,
    travelType: original.travelType,
    createdBy: req.userId,
    members: [{ user: req.userId, role: 'admin' }],
    copiedFrom: original._id,
    copiedFromName: original.name,
    copiedFromCreatorName: creatorMember?.user.name || '',
  })

  // Map each place onto the new trip by day INDEX (day 1 -> day 1, etc.),
  // dropping any that fall past the new range if it's shorter.
  const originalDays = tripDayKeys(original)
  const newDays = tripDayKeys(copy)
  const places = await Place.find({ trip: original._id })

  const copiedPlaces = places
    .map((p) => {
      const dayIndex = originalDays.indexOf(p.day)
      if (dayIndex === -1 || dayIndex >= newDays.length) return null
      return {
        trip: copy._id,
        day: newDays[dayIndex],
        name: p.name,
        source: p.source,
        googlePlaceId: p.googlePlaceId,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        addedBy: req.userId,
        order: p.order,
      }
    })
    .filter(Boolean)

  if (copiedPlaces.length > 0) {
    await Place.insertMany(copiedPlaces)
  }

  await notify({
    user: original.createdBy,
    actor: req.userId,
    type: 'trip_copied',
    trip: original._id,
    tripName: original.name,
  })
  await copy.populate('members.user', 'name email photoUrl')
  res.status(201).json(serializeTrip(copy))
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

router.get('/:id/members/:userId/activity', async (req, res) => {
  const trip = await Trip.findById(req.params.id)
  if (!trip) return res.status(404).json({ error: 'Trip not found' })
  if (!trip.members.some((m) => m.user.toString() === req.userId)) {
    return res.status(403).json({ error: 'Not a member of this trip' })
  }
  if (!trip.members.some((m) => m.user.toString() === req.params.userId)) {
    return res.status(404).json({ error: 'User is not a member of this trip' })
  }

  const [expenses, places, photos, notes] = await Promise.all([
    Expense.find({ trip: trip._id, addedBy: req.params.userId }),
    Place.find({ trip: trip._id, addedBy: req.params.userId }),
    Photo.find({ trip: trip._id, addedBy: req.params.userId }),
    DayNote.find({ trip: trip._id, updatedBy: req.params.userId }),
  ])

  const activity = [
    ...expenses.map((e) => ({
      type: 'expense',
      at: e.createdAt,
      day: e.day,
      name: e.name,
      category: e.category,
      amountYen: e.amountYen,
    })),
    ...places.map((p) => ({
      type: 'place',
      at: p.createdAt,
      day: p.day,
      name: p.name,
      address: p.address,
    })),
    ...photos.map((p) => ({
      type: 'photo',
      at: p.createdAt,
      day: p.day,
      url: p.url,
      note: p.note,
    })),
    ...notes.map((n) => ({
      type: 'note',
      at: n.updatedAt,
      day: n.day,
      note: n.note,
    })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at))

  res.json(activity)
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
  if (trip.endedAt) {
    return res.status(403).json({ error: 'This trip has ended and is now read-only.' })
  }

  const target = trip.members.find((m) => m.user.toString() === userId)
  if (!target) return res.status(404).json({ error: 'User is not a member of this trip' })

  target.role = 'admin'
  await trip.save()
  await trip.populate('members.user', 'name email photoUrl')
  res.json(serializeTrip(trip))
})

export default router
