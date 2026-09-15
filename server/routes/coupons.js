import { Router } from 'express';
import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';
import { requireAdmin } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * Shared validity check used by both the pre-checkout "validate" endpoint
 * and the real redemption inside order creation. Throws with a
 * user-facing message on any failure — never redeems here.
 */
export async function checkCouponValidity(code, subtotal, phone, session) {
  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() }).session(session || null);
  if (!coupon || !coupon.isActive) throw new Error('That coupon code isn\u2019t valid.');

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) throw new Error('That coupon isn\u2019t active yet.');
  if (coupon.expiresAt && now > coupon.expiresAt) throw new Error('That coupon has expired.');
  if (subtotal < coupon.minOrderAmount) {
    throw new Error(`This coupon needs a minimum order of \u09F3${coupon.minOrderAmount}.`);
  }
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
    throw new Error('This coupon has reached its usage limit.');
  }
  if (phone && coupon.perCustomerLimit != null) {
    const usedCount = await Order.countDocuments({
      'customer.phone': phone,
      'coupon.code': coupon.code,
    }).session(session || null);
    if (usedCount >= coupon.perCustomerLimit) {
      throw new Error('You\u2019ve already used this coupon the maximum number of times.');
    }
  }

  return { coupon, discountAmount: Math.round(coupon.computeDiscount(subtotal)) };
}

// POST /api/coupons/validate — public, check-only (used at checkout before placing the order)
router.post('/validate', writeLimiter, async (req, res, next) => {
  try {
    const { code, subtotal, phone } = req.body;
    if (!code || subtotal == null) {
      return res.status(400).json({ error: 'Coupon code and subtotal are required.' });
    }
    const { discountAmount } = await checkCouponValidity(code, Number(subtotal), phone);
    res.json({ valid: true, discountAmount });
  } catch (err) {
    res.status(400).json({ valid: false, error: err.message });
  }
});

// GET /api/admin/coupons
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort('-createdAt');
    res.json(coupons);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/coupons
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const coupon = await Coupon.create({ ...req.body, code: req.body.code?.toUpperCase().trim() });
    res.status(201).json(coupon);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/coupons/:id
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const update = { ...req.body };
    if (update.code) update.code = update.code.toUpperCase().trim();
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ error: 'Coupon not found.' });
    res.json(coupon);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/coupons/:id
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found.' });
    res.json({ message: 'Coupon deleted.' });
  } catch (err) {
    next(err);
  }
});

export default router;
