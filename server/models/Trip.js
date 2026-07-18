import mongoose from 'mongoose'
import crypto from 'node:crypto'

// Discovery-facing category (v2) — distinct from `tripType` below, which
// controls v1 expense-splitting behavior (shared vs. one-pot family).
const TRAVEL_TYPES = ['family', 'couple', 'solo', 'friends']

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

const tripSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    dailyBudget: { type: Number, required: true },
    homeCurrency: { type: String, required: true, uppercase: true, trim: true },
    tripType: { type: String, enum: ['shared', 'family'], default: 'shared' },
    destination: { type: String, default: '', trim: true },
    travelType: { type: String, enum: TRAVEL_TYPES, default: 'family' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    endedAt: { type: Date, default: null },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    copiedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null },
    copiedFromName: { type: String, default: '' },
    copiedFromCreatorName: { type: String, default: '' },
    members: { type: [memberSchema], default: [] },
    inviteToken: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(16).toString('hex'),
    },
  },
  { timestamps: true }
)

// Feed: filter published, order by recency. Search adds travelType equality.
tripSchema.index({ published: 1, publishedAt: -1 })
tripSchema.index({ published: 1, travelType: 1 })
// "My trips" list looks up by membership.
tripSchema.index({ 'members.user': 1 })

export { TRAVEL_TYPES }
export default mongoose.models.Trip || mongoose.model('Trip', tripSchema)
