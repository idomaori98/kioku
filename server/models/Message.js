import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

messageSchema.index({ trip: 1, createdAt: 1 })

export default mongoose.models.Message || mongoose.model('Message', messageSchema)
