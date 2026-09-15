import { Router } from 'express';
import Banner from '../models/Banner.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/banners — public, only currently-active banners within their date window
router.get('/', async (req, res, next) => {
  try {
    const now = new Date();
    const banners = await Banner.find({
      isActive: true,
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
      ],
    }).sort('order');
    res.json(banners);
  } catch (err) {
    next(err);
  }
});

// GET /api/banners/all — admin, everything including inactive/expired
router.get('/all', requireAdmin, async (req, res, next) => {
  try {
    const banners = await Banner.find().sort('order');
    res.json(banners);
  } catch (err) {
    next(err);
  }
});

// POST /api/banners — admin
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json(banner);
  } catch (err) {
    next(err);
  }
});

// PUT /api/banners/:id — admin
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!banner) return res.status(404).json({ error: 'Banner not found.' });
    res.json(banner);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/banners/:id — admin
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ error: 'Banner not found.' });
    res.json({ message: 'Banner deleted.' });
  } catch (err) {
    next(err);
  }
});

export default router;
