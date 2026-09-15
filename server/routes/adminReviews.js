import { Router } from 'express';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAdmin);

async function syncProductRating(productId) {
  const stats = await Review.aggregate([
    { $match: { product: productId, isApproved: true } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(productId, {
    rating: stats[0]?.avg || 0,
    reviewCount: stats[0]?.count || 0,
  });
}

// GET /api/admin/reviews — moderation queue
router.get('/', async (req, res, next) => {
  try {
    const { approved } = req.query;
    const filter = {};
    if (approved !== undefined) filter.isApproved = approved === 'true';

    const reviews = await Review.find(filter).populate('product', 'name slug').sort('-createdAt');
    res.json(reviews);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/reviews/:id — approve/verify/edit
router.patch('/:id', async (req, res, next) => {
  try {
    const { isApproved, verified } = req.body;
    const update = {};
    if (isApproved !== undefined) update.isApproved = isApproved;
    if (verified !== undefined) update.verified = verified;

    const review = await Review.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!review) return res.status(404).json({ error: 'Review not found.' });

    await syncProductRating(review.product);
    res.json(review);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/reviews/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found.' });

    await syncProductRating(review.product);
    res.json({ message: 'Review deleted.' });
  } catch (err) {
    next(err);
  }
});

export default router;
