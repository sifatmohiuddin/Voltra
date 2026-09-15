import { Router } from 'express';
import CartEvent from '../models/CartEvent.js';
import Order from '../models/Order.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// POST /api/analytics/cart-event — public. Client calls this once, when
// checkout starts (real purchase intent), not on every add-to-cart — that
// would just be noise. Upserts by sessionId so retries don't double-count.
router.post('/cart-event', async (req, res, next) => {
  try {
    const { sessionId, itemCount, subtotal } = req.body;
    if (!sessionId || itemCount == null || subtotal == null) {
      return res.status(400).json({ error: 'sessionId, itemCount, and subtotal are required.' });
    }

    await CartEvent.findOneAndUpdate(
      { sessionId, status: 'started' },
      { sessionId, itemCount, subtotal, status: 'started' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/analytics/revenue-trend?days=30 — daily revenue + order count, for a line chart
router.get('/revenue-trend', requireAdmin, async (req, res, next) => {
  try {
    const days = Math.min(90, Math.max(1, Number(req.query.days) || 30));
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const rows = await Order.aggregate([
      { $match: { createdAt: { $gte: since }, status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // fill in zero-days so the chart doesn't have gaps
    const byDate = Object.fromEntries(rows.map((r) => [r._id, r]));
    const series = [];
    for (let d = new Date(since); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      series.push({ date: key, revenue: byDate[key]?.revenue || 0, orders: byDate[key]?.orders || 0 });
    }

    res.json(series);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/analytics/order-quality — fraud vs. legitimate cancellations
router.get('/order-quality', requireAdmin, async (req, res, next) => {
  try {
    const [totalOrders, cancelledOrders, fraudOrders, deliveredOrders] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'Cancelled' }),
      Order.countDocuments({ isFraudSuspected: true }),
      Order.countDocuments({ status: 'Delivered' }),
    ]);

    res.json({
      totalOrders,
      cancelledOrders,
      fraudOrders,
      deliveredOrders,
      cancellationRate: totalOrders ? Number(((cancelledOrders / totalOrders) * 100).toFixed(1)) : 0,
      fraudRate: totalOrders ? Number(((fraudOrders / totalOrders) * 100).toFixed(1)) : 0,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/analytics/cart-conversion — checkout starts vs. completed orders
router.get('/cart-conversion', requireAdmin, async (req, res, next) => {
  try {
    const [started, converted] = await Promise.all([
      CartEvent.countDocuments(),
      CartEvent.countDocuments({ status: 'converted' }),
    ]);
    res.json({
      started,
      converted,
      abandoned: started - converted,
      conversionRate: started ? Number(((converted / started) * 100).toFixed(1)) : 0,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
