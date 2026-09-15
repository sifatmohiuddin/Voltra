import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: '' },
    image: { type: String, required: true },
    ctaText: { type: String, trim: true, default: 'Shop now' },
    ctaLink: { type: String, trim: true, default: '/products' },
    order: { type: Number, default: 0 }, // display priority, lower shows first
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Banner', bannerSchema);
