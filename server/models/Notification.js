import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['friend_request', 'friend_accept', 'comment', 'like', 'trip_copied', 'follow'],
      required: true,
    },
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
    tripName: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
)

notificationSchema.index({ user: 1, createdAt: -1 })
notificationSchema.index({ user: 1, read: 1 })

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema)
