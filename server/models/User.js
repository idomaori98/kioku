import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    photoUrl: { type: String, default: '' },
  },
  { timestamps: true }
)

export default mongoose.models.User || mongoose.model('User', userSchema)
