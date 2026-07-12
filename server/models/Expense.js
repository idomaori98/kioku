import mongoose from 'mongoose'

const CATEGORIES = ['food', 'transport', 'fun', 'shopping', 'other']

const expenseSchema = new mongoose.Schema(
  {
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    day: { type: String, required: true }, // YYYY-MM-DD, Japan-timezone calendar day
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES, default: 'other' },
    amountYen: { type: Number, required: true },
    homeCurrency: { type: String, required: true, uppercase: true },
    exchangeRate: { type: Number, required: true }, // JPY -> homeCurrency, at time of entry
    amountHome: { type: Number, required: true },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

expenseSchema.index({ trip: 1, day: 1 })

export const EXPENSE_CATEGORIES = CATEGORIES
export default mongoose.models.Expense || mongoose.model('Expense', expenseSchema)
