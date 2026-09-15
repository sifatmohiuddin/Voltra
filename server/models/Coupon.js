import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 }, // percent (0-100) or flat BDT amount

    minOrderAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null }, // caps a percentage discount, ignored for fixed

    usageLimit: { type: Number, default: null }, // total redemptions allowed, null = unlimited
    usageCount: { type: Number, default: 0 },
    perCustomerLimit: { type: Number, default: 1 }, // by phone number, since guest checkout has no accounts

    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.methods.computeDiscount = function (subtotal) {
  if (this.type === 'fixed') return Math.min(this.value, subtotal);
  const raw = (subtotal * this.value) / 100;
  return this.maxDiscount != null ? Math.min(raw, this.maxDiscount) : raw;
};

export default mongoose.model('Coupon', couponSchema);
