import mongoose from 'mongoose';

// اسم القاعدة يُحدد هنا حتى لو لم يكن موجوداً في رابط Atlas
export async function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) throw new Error('MONGODB_URI غير معرّف في ملف .env');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || 'astro' });
  console.log(`✔ Connected to MongoDB (db: ${mongoose.connection.name})`);
}
