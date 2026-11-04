import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'الاسم مطلوب'] },
    email: { type: String, required: [true, 'البريد مطلوب'] },
    phone: String,
    subject: String,
    message: { type: String, required: [true, 'الرسالة مطلوبة'] },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
