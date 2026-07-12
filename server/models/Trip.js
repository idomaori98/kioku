import mongoose from 'mongoose'
import crypto from 'node:crypto'

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
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    endedAt: { type: Date, default: null },
    members: { type: [memberSchema], default: [] },
    inviteToken: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(16).toString('hex'),
    },
  },
  { timestamps: true }
)

export default mongoose.models.Trip || mongoose.model('Trip', tripSchema)
