import { Router } from 'express';
import Review from '../models/Review.js';

const router = Router();

// GET /api/reviews/featured — highest-rated recent reviews, across products
router.get('/featured', async (req, res, next) => {
  try {
    const reviews = await Review.find({ isApproved: true, rating: { $gte: 4 } })
      .populate('product', 'name slug')
      .sort('-createdAt')
      .limit(6);
    res.json(reviews);
  } catch (err) {
    next(err);
  }
});

export default router;
