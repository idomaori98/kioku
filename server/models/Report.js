import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['user', 'trip', 'comment'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, default: '', trim: true },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

reportSchema.index({ resolved: 1, createdAt: -1 })

export default mongoose.models.Report || mongoose.model('Report', reportSchema)
