import { Router } from 'express';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import { writeLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { basePrice: 1 },
  price_desc: { basePrice: -1 },
  popularity: { rating: -1, reviewCount: -1 },
};

// GET /api/products — search, filter, sort, paginate
// query: q, category, brand, minPrice, maxPrice, sort, featured, bestSeller, page, limit
router.get('/', async (req, res, next) => {
  try {
    const {
      q,
      category,
      brand,
      minPrice,
      maxPrice,
      sort = 'newest',
      featured,
      bestSeller,
      discounted,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = { status: 'active' };
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (featured === 'true') filter.isFeatured = true;
    if (bestSeller === 'true') filter.isBestSeller = true;
    if (discounted === 'true') {
      filter.discountPrice = { $ne: null };
      filter.$expr = { $lt: ['$discountPrice', '$basePrice'] };
    }
    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = Number(minPrice);
      if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
    }
    if (q) filter.$text = { $search: q };

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(48, Math.max(1, Number(limit)));

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort(SORTS[sort] || SORTS.newest)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:slug — detail
router.get('/:slug', async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, status: 'active' }).populate(
      'category',
      'name slug'
    );
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      status: 'active',
    })
      .limit(4)
      .select('name slug images basePrice discountPrice rating');

    res.json({ product, related });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id/reviews
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.id, isApproved: true }).sort(
      '-createdAt'
    );
    res.json(reviews);
  } catch (err) {
    next(err);
  }
});

// POST /api/products/:id/reviews — guest-submittable
router.post('/:id/reviews', writeLimiter, async (req, res, next) => {
  try {
    const { name, email, rating, comment, photos } = req.body;
    if (!name || !rating || !comment) {
      return res.status(400).json({ error: 'Name, rating, and comment are required.' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    const review = await Review.create({
      product: product._id,
      name,
      email,
      rating,
      comment,
      photos: Array.isArray(photos) ? photos.slice(0, 5) : [],
    });

    // keep the product's cached rating/count in sync
    const stats = await Review.aggregate([
      { $match: { product: product._id, isApproved: true } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    product.rating = stats[0]?.avg || 0;
    product.reviewCount = stats[0]?.count || 0;
    await product.save();

    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
});

export default router;
