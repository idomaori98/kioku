import { Router } from 'express'
import Photo from '../models/Photo.js'
import { createUploadUrl, deleteObject } from '../lib/s3.js'
import { requireTripMembership, requireTripNotEnded } from '../middleware/tripMembership.js'
import { tripDayKeys } from '../lib/days.js'

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png']

const router = Router({ mergeParams: true })
router.use(requireTripMembership)

function serializePhoto(p) {
  return {
    id: p._id,
    day: p.day,
    url: p.url,
    note: p.note,
    addedBy: { id: p.addedBy._id, name: p.addedBy.name },
    createdAt: p.createdAt,
  }
}

router.post('/upload-url', requireTripNotEnded, async (req, res) => {
  const { contentType } = req.body
  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    return res.status(400).json({ error: 'contentType must be image/jpeg or image/png' })
  }
  const { uploadUrl, key, publicUrl } = await createUploadUrl(
    `trips/${req.params.tripId}`,
    contentType
  )
  res.json({ uploadUrl, key, publicUrl })
})

router.get('/', async (req, res) => {
  const filter = { trip: req.params.tripId }
  if (req.query.day) filter.day = req.query.day
  const sort = req.query.day ? { order: 1, createdAt: 1 } : { createdAt: 1 }
  const photos = await Photo.find(filter).sort(sort).populate('addedBy', 'name')
  res.json(photos.map(serializePhoto))
})

router.put('/reorder', requireTripNotEnded, async (req, res) => {
  const requester = req.trip.members.find((m) => m.user.toString() === req.userId)
  if (!requester || requester.role !== 'admin') {
    return res.status(403).json({ error: 'Only an admin can reorder photos' })
  }
  const { day, orderedIds } = req.body
  if (!day || !Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'day and orderedIds are required' })
  }
  await Promise.all(
    orderedIds.map((photoId, index) =>
      Photo.updateOne({ _id: photoId, trip: req.params.tripId, day }, { order: index })
    )
  )
  res.status(204).end()
})

router.post('/', requireTripNotEnded, async (req, res) => {
  const { day, key, publicUrl, note } = req.body
  if (!day || !key || !publicUrl) {
    return res.status(400).json({ error: 'day, key, and publicUrl are required' })
  }
  if (!tripDayKeys(req.trip).includes(day)) {
    return res.status(400).json({ error: 'day must fall within the trip dates' })
  }

  const order = await Photo.countDocuments({ trip: req.params.tripId, day })
  const photo = await Photo.create({
    trip: req.params.tripId,
    day,
    key,
    url: publicUrl,
    note: note || '',
    addedBy: req.userId,
    order,
  })
  await photo.populate('addedBy', 'name')
  res.status(201).json(serializePhoto(photo))
})

router.put('/:photoId', requireTripNotEnded, async (req, res) => {
  const { note } = req.body
  const photo = await Photo.findOne({ _id: req.params.photoId, trip: req.params.tripId })
  if (!photo) return res.status(404).json({ error: 'Photo not found' })

  photo.note = note || ''
  await photo.save()
  await photo.populate('addedBy', 'name')
  res.json(serializePhoto(photo))
})

router.delete('/:photoId', requireTripNotEnded, async (req, res) => {
  const photo = await Photo.findOneAndDelete({ _id: req.params.photoId, trip: req.params.tripId })
  if (!photo) return res.status(404).json({ error: 'Photo not found' })
  await deleteObject(photo.key).catch(() => {})
  res.status(204).end()
})

export default router
