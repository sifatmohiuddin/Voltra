import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
    photos: { type: [String], default: [] },
    verified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true }, // set false to hold for moderation
  },
  { timestamps: true }
);

export default mongoose.model('Review', reviewSchema);
