import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'site' },
    siteName: { type: String, default: 'Electronics Astro' },
    tagline: { type: String, default: 'منصتك المتخصصة للإلكترونيات والحلول التقنية' },
    currency: { type: String, default: '₪' },
    contact: {
      email: { type: String, default: 'info@astro.ps' },
      phone: { type: String, default: '+970 59 000 0000' },
      whatsapp: { type: String, default: '+970590000000' },
      address: { type: String, default: 'فلسطين' },
      hours: { type: String, default: 'السبت - الخميس، 9 صباحاً - 6 مساءً' },
    },
    social: { facebook: String, instagram: String, youtube: String, linkedin: String },
    shippingMethods: [
      {
        code: String, name: String, cost: Number, eta: String,
        freeOver: { type: Number, default: 0 }, isActive: { type: Boolean, default: true }, _id: false,
      },
    ],
    paymentMethods: [
      { code: String, name: String, instructions: String, isActive: { type: Boolean, default: true }, _id: false },
    ],
    taxRate: { type: Number, default: 0 },
    policies: { shipping: String, returns: String, privacy: String, terms: String },
    about: { story: String, vision: String, mission: String, goals: [String], audiences: [String] },
    banner: { title: String, subtitle: String, cta: String },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

settingsSchema.statics.get = async function () {
  return (await this.findById('site')) || this.create({ _id: 'site' });
};

export default mongoose.model('Settings', settingsSchema);
