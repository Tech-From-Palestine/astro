import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: [true, 'الكود مطلوب'], unique: true, uppercase: true, trim: true },
    description: String,
    type: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
    value: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 0 }, // 0 = غير محدود
    used: { type: Number, default: 0 },
    expiresAt: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.methods.evaluate = function (subtotal) {
  if (!this.isActive) return { ok: false, message: 'الكوبون غير مفعل' };
  if (this.expiresAt && this.expiresAt < new Date()) return { ok: false, message: 'انتهت صلاحية الكوبون' };
  if (this.usageLimit && this.used >= this.usageLimit) return { ok: false, message: 'تم استنفاد الكوبون' };
  if (subtotal < this.minOrder) return { ok: false, message: `الحد الأدنى للطلب ${this.minOrder}` };
  const discount = this.type === 'percent' ? (subtotal * this.value) / 100 : this.value;
  return { ok: true, discount: Math.min(Math.round(discount * 100) / 100, subtotal) };
};

export default mongoose.model('Coupon', couponSchema);
