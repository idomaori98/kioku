import mongoose from 'mongoose'

const placeSchema = new mongoose.Schema(
  {
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    day: { type: String, required: true }, // YYYY-MM-DD
    name: { type: String, required: true, trim: true },
    source: { type: String, enum: ['google', 'manual'], required: true },
    googlePlaceId: { type: String },
    address: { type: String, default: '' },
    lat: { type: Number },
    lng: { type: Number },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

placeSchema.index({ trip: 1, day: 1 })

export default mongoose.models.Place || mongoose.model('Place', placeSchema)
