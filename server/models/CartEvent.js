import mongoose from 'mongoose';

const cartEventSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    itemCount: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    status: { type: String, enum: ['started', 'converted'], default: 'started' },
  },
  { timestamps: true }
);

export default mongoose.model('CartEvent', cartEventSchema);
