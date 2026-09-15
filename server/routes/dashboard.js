import { Router } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAdmin);

const LOW_STOCK_THRESHOLD = 5;

router.get('/stats', async (req, res, next) => {
  try {
    const [revenueAgg, ordersByStatus, totalProducts, recentOrders, allProducts] =
      await Promise.all([
        Order.aggregate([
          { $match: { status: { $ne: 'Cancelled' } } },
          { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
        ]),
        Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Product.countDocuments({ status: 'active' }),
        Order.find().sort('-createdAt').limit(5).select('orderNumber customer.name total status createdAt'),
        Product.find({ status: 'active' }).select('name stock variants'),
      ]);

    const lowStockProducts = allProducts.filter((p) => {
      const total = p.variants?.length
        ? p.variants.reduce((s, g) => s + g.options.reduce((s2, o) => s2 + o.stock, 0), 0)
        : p.stock;
      return total <= LOW_STOCK_THRESHOLD;
    });

    res.json({
      totalRevenue: revenueAgg[0]?.revenue || 0,
      totalOrders: revenueAgg[0]?.orders || 0,
      totalProducts,
      ordersByStatus: Object.fromEntries(ordersByStatus.map((s) => [s._id, s.count])),
      lowStockCount: lowStockProducts.length,
      lowStockProducts: lowStockProducts.slice(0, 5).map((p) => p.name),
      recentOrders,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
