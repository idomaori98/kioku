import { Router } from 'express'
import Report from '../models/Report.js'
import Comment from '../models/Comment.js'
import Trip from '../models/Trip.js'
import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'

const router = Router()
router.use(requireAuth, requireAdmin)

// Attach a human-readable snapshot of each report's target so the admin can
// judge it without hunting for the content (which may since be deleted).
async function enrichReport(report) {
  const base = {
    id: report._id,
    targetType: report.targetType,
    targetId: report.targetId,
    reason: report.reason,
    resolved: report.resolved,
    createdAt: report.createdAt,
  }

  if (report.targetType === 'comment') {
    const comment = await Comment.findById(report.targetId).populate('user', 'name')
    base.target = comment
      ? { text: comment.text, authorName: comment.user?.name || 'Unknown', tripId: comment.trip, deleted: false }
      : { deleted: true }
  } else if (report.targetType === 'trip') {
    const trip = await Trip.findById(report.targetId)
    base.target = trip
      ? { name: trip.name, published: trip.published, deleted: false }
      : { deleted: true }
  } else if (report.targetType === 'user') {
    const user = await User.findById(report.targetId)
    base.target = user ? { name: user.name, deleted: false } : { deleted: true }
  }

  return base
}

router.get('/reports', async (req, res) => {
  // `{ $ne: true }` also covers legacy reports saved before the resolved field existed.
  const openFilter = { resolved: { $ne: true } }
  const filter = req.query.status === 'all' ? {} : openFilter
  const reports = await Report.find(filter)
    .sort({ resolved: 1, createdAt: -1 })
    .limit(200)
    .populate('reporter', 'name')

  const enriched = await Promise.all(
    reports.map(async (r) => ({
      ...(await enrichReport(r)),
      reporterName: r.reporter?.name || 'Unknown',
    }))
  )
  const openCount = await Report.countDocuments(openFilter)
  res.json({ reports: enriched, openCount })
})

router.post('/reports/:id/resolve', async (req, res) => {
  const report = await Report.findById(req.params.id)
  if (!report) return res.status(404).json({ error: 'Report not found' })
  report.resolved = true
  report.resolvedAt = new Date()
  await report.save()
  res.json({ ok: true })
})

// Resolve every open report pointing at a target we just acted on.
async function resolveReportsFor(targetType, targetId) {
  await Report.updateMany(
    { targetType, targetId, resolved: false },
    { resolved: true, resolvedAt: new Date() }
  )
}

router.delete('/comments/:id', async (req, res) => {
  const comment = await Comment.findById(req.params.id)
  if (comment) await comment.deleteOne()
  await resolveReportsFor('comment', req.params.id)
  res.json({ ok: true })
})

router.post('/trips/:id/unpublish', async (req, res) => {
  const trip = await Trip.findById(req.params.id)
  if (!trip) return res.status(404).json({ error: 'Trip not found' })
  trip.published = false
  await trip.save()
  await resolveReportsFor('trip', req.params.id)
  res.json({ ok: true })
})

export default router
