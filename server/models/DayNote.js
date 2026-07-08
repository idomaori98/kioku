import mongoose from 'mongoose'

const dayNoteSchema = new mongoose.Schema(
  {
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    day: { type: String, required: true }, // YYYY-MM-DD
    note: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

dayNoteSchema.index({ trip: 1, day: 1 }, { unique: true })

export default mongoose.models.DayNote || mongoose.model('DayNote', dayNoteSchema)
