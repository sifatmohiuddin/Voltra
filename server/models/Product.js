import mongoose from 'mongoose';

const variantOptionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

const variantGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [variantOptionSchema],
      default: [],
    },
  },
  { _id: true }
);

// Example:
// {
//   options: [
//     { groupId: ColorGroupId, optionId: RedOptionId },
//     { groupId: SizeGroupId, optionId: MediumOptionId }
//   ],
//   stock: 10,
//   priceModifier: 0,
//   sku: "TSHIRT-RED-M"
// }

const variantCombinationSchema = new mongoose.Schema(
  {
    options: [
      {
        groupId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },

        optionId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
      },
    ],

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    priceModifier: {
      type: Number,
      default: 0,
    },

    sku: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const specSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },

    value: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    brand: {
      type: String,
      trim: true,
      default: '',
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },

    images: {
      type: [String],
      default: [],
    },

    shortDescription: {
      type: String,
      trim: true,
      default: '',
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    specifications: {
      type: [specSchema],
      default: [],
    },

    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPrice: {
      type: Number,
      min: 0,
      default: null,
    },

    saleEndsAt: {
      type: Date,
      default: null,
    },

    currency: {
      type: String,
      default: 'BDT',
    },

    // Variant types
    variants: {
      type: [variantGroupSchema],
      default: [],
    },

    // Actual purchasable combinations
    variantCombinations: {
      type: [variantCombinationSchema],
      default: [],
    },

    // Used only when there are no variants
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    tags: {
      type: [String],
      default: [],
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isBestSeller: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

productSchema.index({
  name: 'text',
  tags: 'text',
  brand: 'text',
});

productSchema.virtual('totalStock').get(function () {
  if (this.variantCombinations?.length) {
    return this.variantCombinations.reduce(
      (sum, combination) => sum + combination.stock,
      0
    );
  }

  return this.stock;
});

productSchema.virtual('finalPrice').get(function () {
  return this.discountPrice != null &&
    this.discountPrice < this.basePrice
    ? this.discountPrice
    : this.basePrice;
});

productSchema.virtual('discountPercent').get(function () {
  if (
    this.discountPrice == null ||
    this.discountPrice >= this.basePrice
  ) {
    return 0;
  }

  return Math.round(
    ((this.basePrice - this.discountPrice) /
      this.basePrice) *
    100
  );
});

productSchema.virtual('isOnFlashSale').get(function () {
  return Boolean(
    this.saleEndsAt &&
    this.saleEndsAt.getTime() > Date.now() &&
    this.discountPrice != null
  );
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export default mongoose.model('Product', productSchema);