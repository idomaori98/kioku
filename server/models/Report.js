import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['user', 'trip', 'comment'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, default: '', trim: true },
  },
  { timestamps: true }
)

export default mongoose.models.Report || mongoose.model('Report', reportSchema)
