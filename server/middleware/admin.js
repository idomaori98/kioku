import User from '../models/User.js'

// Assumes requireAuth ran first (req.userId is set).
export async function requireAdmin(req, res, next) {
  const user = await User.findById(req.userId)
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: 'Admins only' })
  }
  req.adminUser = user
  next()
}
