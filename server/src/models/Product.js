import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'اسم المنتج مطلوب'], trim: true },
    slug: { type: String, required: true, unique: true },
    sku: { type: String, unique: true, sparse: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'التصنيف مطلوب'] },
    brand: String,
    shortDescription: String,
    description: String,
    specs: [{ key: String, value: String, _id: false }],
    images: [String],
    datasheetUrl: String,
    price: { type: Number, required: [true, 'السعر مطلوب'], min: 0 },
    comparePrice: { type: Number, min: 0 }, // السعر قبل الخصم (العرض)
    cost: { type: Number, default: 0, min: 0 }, // تكلفة الشراء لحساب الربح
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    featured: { type: Boolean, default: false },
    isAstro: { type: Boolean, default: false }, // منتجات Astro الخاصة
    tags: [String],
    sold: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.virtual('onSale').get(function () {
  return !!this.comparePrice && this.comparePrice > this.price;
});

productSchema.index({ name: 'text', description: 'text', tags: 'text', sku: 'text' });

export default mongoose.model('Product', productSchema);
