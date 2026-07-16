import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema(
  {
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

commentSchema.index({ trip: 1, createdAt: 1 })

export default mongoose.models.Comment || mongoose.model('Comment', commentSchema)
