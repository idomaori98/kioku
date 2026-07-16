import mongoose from 'mongoose'

const directMessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, default: '', trim: true },
    sharedTripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null },
    sharedTripName: { type: String, default: '' },
    sharedTripDestination: { type: String, default: '' },
    sharedTripCoverUrl: { type: String, default: '' },
  },
  { timestamps: true }
)

directMessageSchema.index({ sender: 1, recipient: 1, createdAt: 1 })

export default mongoose.models.DirectMessage || mongoose.model('DirectMessage', directMessageSchema)
