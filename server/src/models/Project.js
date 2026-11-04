import mongoose from 'mongoose';

// المشاريع والحلول المنفّذة
const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'العنوان مطلوب'] },
    slug: { type: String, required: true, unique: true },
    client: String,
    sector: String,
    summary: String,
    description: String,
    image: String,
    technologies: [String],
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    year: Number,
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
