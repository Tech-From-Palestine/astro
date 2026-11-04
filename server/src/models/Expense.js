import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'البيان مطلوب'] },
    category: {
      type: String,
      enum: ['inventory', 'shipping', 'salaries', 'rent', 'marketing', 'utilities', 'other'],
      default: 'other',
    },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model('Expense', expenseSchema);
