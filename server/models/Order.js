import mongoose from 'mongoose';

export const ORDER_STATUSES = [
  'Placed',
  'Confirmed',
  'Processing',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

export const PAYMENT_METHODS = ['COD', 'bKash', 'Nagad'];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true }, // snapshot — survives future product edits
    image: { type: String, default: '' },
    variant: {
      name: { type: String, default: '' }, // e.g. "Color"
      label: { type: String, default: '' }, // e.g. "Midnight Black"
    },
    price: { type: Number, required: true }, // unit price at time of order
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const statusEventSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    note: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },

    items: { type: [orderItemSchema], required: true, validate: (v) => v.length > 0 },

    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, trim: true, default: '' },
      address: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      area: { type: String, trim: true, default: '' },
    },

    deliveryZone: { type: String, enum: ['Inside Dhaka', 'Outside Dhaka'], required: true },
    deliveryCharge: { type: Number, required: true, min: 0 },

    payment: {
      method: { type: String, enum: PAYMENT_METHODS, required: true },
      status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
      transactionId: { type: String, default: '' },
    },

    subtotal: { type: Number, required: true, min: 0 },
    coupon: {
      code: { type: String, default: '' },
      discountAmount: { type: Number, default: 0 },
    },
    total: { type: Number, required: true, min: 0 },

    status: { type: String, enum: ORDER_STATUSES, default: 'Placed' },
    statusHistory: {
      type: [statusEventSchema],
      default: () => [{ status: 'Placed', at: new Date() }],
    },

    // Separate from `status` — a legitimate cancellation and a fraud/prank
    // order are both "Cancelled", but they mean very different things for
    // reporting. This lets analytics tell the two apart.
    isFraudSuspected: { type: Boolean, default: false },
    fraudNote: { type: String, default: '' },

    // Set when the client reports a checkout-start event (see CartEvent) —
    // lets that event be marked converted once the order lands.
    cartSessionId: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
