import mongoose from 'mongoose';

export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
export const PAYMENT_STATUSES = ['pending', 'paid', 'partially_refunded', 'refunded', 'failed'];

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    sku: String,
    image: String,
    price: Number,
    cost: Number,
    qty: { type: Number, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    invoiceNumber: { type: String, unique: true, sparse: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customer: {
      name: { type: String, required: [true, 'اسم المستلم مطلوب'] },
      email: String,
      phone: { type: String, required: [true, 'رقم الهاتف مطلوب'] },
    },
    shipping: {
      city: { type: String, required: [true, 'المدينة مطلوبة'] },
      address: { type: String, required: [true, 'العنوان مطلوب'] },
      notes: String,
      method: { code: String, name: String, eta: String },
      trackingNumber: String,
    },
    items: { type: [itemSchema], validate: [(v) => v.length > 0, 'السلة فارغة'] },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending' },
    statusHistory: [{ status: String, note: String, at: { type: Date, default: Date.now }, _id: false }],
    coupon: String,
    subtotal: Number,
    discount: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    total: Number,
    amountPaid: { type: Number, default: 0 },
    refunds: [{ amount: Number, reason: String, at: { type: Date, default: Date.now } }],
    refundedTotal: { type: Number, default: 0 },
    paidAt: Date,
    adminNotes: String,
  },
  { timestamps: true }
);

orderSchema.virtual('costOfGoods').get(function () {
  return this.items.reduce((s, i) => s + (i.cost || 0) * i.qty, 0);
});
orderSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Order', orderSchema);
