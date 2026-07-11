import { Router } from 'express'
import Place from '../models/Place.js'
import { requireTripMembership } from '../middleware/tripMembership.js'
import { tripDayKeys } from '../lib/days.js'

const router = Router({ mergeParams: true })
router.use(requireTripMembership)

function serializePlace(p) {
  return {
    id: p._id,
    day: p.day,
    name: p.name,
    source: p.source,
    address: p.address,
    lat: p.lat,
    lng: p.lng,
    addedBy: { id: p.addedBy._id, name: p.addedBy.name },
    createdAt: p.createdAt,
  }
}

router.get('/', async (req, res) => {
  const filter = { trip: req.params.tripId }
  if (req.query.day) filter.day = req.query.day
  const places = await Place.find(filter).sort({ createdAt: 1 }).populate('addedBy', 'name')
  res.json(places.map(serializePlace))
})

router.post('/', async (req, res) => {
  const { day, name, source, googlePlaceId, address, lat, lng } = req.body
  if (!day || !name?.trim() || !source) {
    return res.status(400).json({ error: 'day, name, and source are required' })
  }
  if (!['google', 'manual'].includes(source)) {
    return res.status(400).json({ error: 'source must be "google" or "manual"' })
  }
  if (!tripDayKeys(req.trip).includes(day)) {
    return res.status(400).json({ error: 'day must fall within the trip dates' })
  }
  if (lat !== undefined && (typeof lat !== 'number' || lat < -90 || lat > 90)) {
    return res.status(400).json({ error: 'lat must be a number between -90 and 90' })
  }
  if (lng !== undefined && (typeof lng !== 'number' || lng < -180 || lng > 180)) {
    return res.status(400).json({ error: 'lng must be a number between -180 and 180' })
  }

  const place = await Place.create({
    trip: req.params.tripId,
    day,
    name: name.trim(),
    source,
    googlePlaceId,
    address: address || '',
    lat,
    lng,
    addedBy: req.userId,
  })
  await place.populate('addedBy', 'name')
  res.status(201).json(serializePlace(place))
})

router.put('/:placeId', async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) {
    return res.status(400).json({ error: 'name is required' })
  }
  const place = await Place.findOne({ _id: req.params.placeId, trip: req.params.tripId })
  if (!place) return res.status(404).json({ error: 'Place not found' })

  place.name = name.trim()
  await place.save()
  await place.populate('addedBy', 'name')
  res.json(serializePlace(place))
})

router.delete('/:placeId', async (req, res) => {
  const place = await Place.findOneAndDelete({ _id: req.params.placeId, trip: req.params.tripId })
  if (!place) return res.status(404).json({ error: 'Place not found' })
  res.status(204).end()
})

export default router
