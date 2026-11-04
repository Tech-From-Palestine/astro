import mongoose from 'mongoose';

// طلبات الخدمات، عروض الأسعار للكميات الكبيرة، والمنتجات المخصصة
const requestSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['service', 'quote', 'custom'], default: 'service' },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: [true, 'الاسم مطلوب'] },
    email: { type: String, required: [true, 'البريد مطلوب'] },
    phone: String,
    organization: String,
    budget: String,
    details: { type: String, required: [true, 'التفاصيل مطلوبة'] },
    status: { type: String, enum: ['new', 'in_review', 'quoted', 'in_progress', 'done', 'rejected'], default: 'new' },
    adminNotes: String,
  },
  { timestamps: true }
);

export default mongoose.model('Request', requestSchema);
