import mongoose from 'mongoose'

const photoSchema = new mongoose.Schema(
  {
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    day: { type: String, required: true }, // YYYY-MM-DD
    key: { type: String, required: true },
    url: { type: String, required: true },
    note: { type: String, default: '' },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: Number, default: 0 },
    hiddenFromPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
)

photoSchema.index({ trip: 1, day: 1 })

export default mongoose.models.Photo || mongoose.model('Photo', photoSchema)
