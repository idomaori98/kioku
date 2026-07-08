import Trip from '../models/Trip.js'

export async function requireTripMembership(req, res, next) {
  const trip = await Trip.findById(req.params.tripId)
  if (!trip) return res.status(404).json({ error: 'Trip not found' })
  if (!trip.members.some((m) => m.user.toString() === req.userId)) {
    return res.status(403).json({ error: 'Not a member of this trip' })
  }
  req.trip = trip
  next()
}
