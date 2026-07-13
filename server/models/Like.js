import mongoose from 'mongoose'

const likeSchema = new mongoose.Schema(
  {
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

likeSchema.index({ trip: 1, user: 1 }, { unique: true })

export default mongoose.models.Like || mongoose.model('Like', likeSchema)
