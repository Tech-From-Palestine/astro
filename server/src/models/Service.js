import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'عنوان الخدمة مطلوب'] },
    slug: { type: String, required: true, unique: true },
    icon: { type: String, default: '🛠️' },
    summary: String,
    description: String,
    features: [String],
    priceFrom: Number,
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Service', serviceSchema);
