import { Router } from 'express'
import Report from '../models/Report.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.post('/', async (req, res) => {
  const { targetType, targetId, reason } = req.body
  if (!['user', 'trip', 'comment'].includes(targetType) || !targetId) {
    return res.status(400).json({ error: 'targetType and targetId are required' })
  }

  await Report.create({
    reporter: req.userId,
    targetType,
    targetId,
    reason: reason?.trim() || '',
  })
  res.status(201).json({ ok: true })
})

export default router
