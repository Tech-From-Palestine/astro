import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema(
  { label: String, city: String, address: String, phone: String },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'الاسم مطلوب'], trim: true },
    email: { type: String, required: [true, 'البريد مطلوب'], unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: String,
    customerType: {
      type: String,
      enum: ['student', 'engineer', 'developer', 'hobbyist', 'startup', 'school', 'company', 'lab', 'other'],
      default: 'other',
    },
    company: String,
    role: { type: String, enum: ['customer', 'staff', 'admin'], default: 'customer' },
    permissions: [String],
    addresses: [addressSchema],
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (pw) {
  return bcrypt.compare(pw, this.password);
};

userSchema.methods.toJSON = function () {
  const o = this.toObject();
  delete o.password;
  return o;
};

export default mongoose.model('User', userSchema);
