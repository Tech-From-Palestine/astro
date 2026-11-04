import mongoose from 'mongoose';

// المركز التقني: مقالات، شروحات، مشاريع تعليمية، مصادر
const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'العنوان مطلوب'] },
    slug: { type: String, required: true, unique: true },
    type: { type: String, enum: ['article', 'tutorial', 'project', 'resource'], default: 'article' },
    excerpt: String,
    body: String,
    cover: String,
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    tags: [String],
    relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    author: String,
    isPublished: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Article', articleSchema);
