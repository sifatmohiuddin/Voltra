import { Router } from 'express';
import mongoose from 'mongoose';
import Order, { ORDER_STATUSES, PAYMENT_METHODS } from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import CartEvent from '../models/CartEvent.js';
import { requireAdmin } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { generateOrderNumber } from '../utils/generateOrderNumber.js';
import { getDeliveryCharge } from '../utils/delivery.js';
import { checkCouponValidity } from './coupons.js';

const router = Router();

// Atomically checks stock and decrements it for one order line, inside
// the given session. Throws (aborting the transaction) if unavailable.
async function reserveStock(item, session) {
  const {
    productId,
    variantCombinationId,
    quantity,
  } = item;

  const product = await Product.findById(productId).session(session);

  if (!product || product.status !== 'active') {
    const err = new Error(`Product unavailable: ${productId}`);
    err.status = 400;
    throw err;
  }

  let unitPrice = product.discountPrice ?? product.basePrice;

  let variantSnapshot = {
    name: '',
    label: '',
    options: [],
    combinationId: null,
    sku: '',
  };

  /*
   * VARIANT PRODUCT
   *
   * Stock belongs to the exact variant combination.
   */
  if (variantCombinationId) {
    const combination = product.variantCombinations?.id(
      variantCombinationId
    );

    if (!combination) {
      const err = new Error(
        `Selected variant combination no longer exists for ${product.name}.`
      );
      err.status = 400;
      throw err;
    }

    /*
     * Atomically check and decrement the exact combination.
     */
    const updated = await Product.findOneAndUpdate(
      {
        _id: productId,
        variantCombinations: {
          $elemMatch: {
            _id: variantCombinationId,
            stock: { $gte: quantity },
          },
        },
      },
      {
        $inc: {
          'variantCombinations.$.stock': -quantity,
        },
      },
      {
        session,
        returnDocument: 'after',
      }
    );

    if (!updated) {
      const err = new Error(
        `Not enough stock for ${product.name}.`
      );
      err.status = 409;
      throw err;
    }

    unitPrice += combination.priceModifier || 0;

    /*
     * Convert the stored groupId/optionId references into
     * human-readable information for the order snapshot.
     */
    const readableOptions = combination.options.map((selected) => {
      let groupName = '';
      let label = '';

      const group = product.variants?.id(selected.groupId);

      if (group) {
        groupName = group.name;

        const option = group.options.id(selected.optionId);

        if (option) {
          label = option.label;
        }
      }

      return {
        groupId: selected.groupId,
        optionId: selected.optionId,
        groupName,
        label,
      };
    });

    variantSnapshot = {
      name: '',
      label: '',
      options: readableOptions,
      combinationId: combination._id,
      sku: combination.sku || '',
    };
  }

  /*
   * NORMAL PRODUCT
   *
   * No variant combination means stock belongs to product.stock.
   */
  else {
    if (product.stock < quantity) {
      const err = new Error(
        `Not enough stock for ${product.name}.`
      );
      err.status = 409;
      throw err;
    }

    const updated = await Product.findOneAndUpdate(
      {
        _id: productId,
        stock: { $gte: quantity },
      },
      {
        $inc: {
          stock: -quantity,
        },
      },
      {
        session,
        returnDocument: 'after',
      }
    );

    if (!updated) {
      const err = new Error(
        `Not enough stock for ${product.name}.`
      );
      err.status = 409;
      throw err;
    }
  }

  return {
    product: product._id,
    name: product.name,
    image: product.images?.[0] || '',
    variant: variantSnapshot,
    price: unitPrice,
    quantity,
  };
}

// POST /api/orders — place an order (guest checkout)
router.post('/', writeLimiter, async (req, res, next) => {
  const { items, customer, deliveryZone, payment, couponCode, cartSessionId } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must include at least one item.' });
  }
  if (!customer?.name || !customer?.phone || !customer?.address || !customer?.city) {
    return res.status(400).json({ error: 'Name, phone, address, and city are required.' });
  }
  if (!['Inside Dhaka', 'Outside Dhaka'].includes(deliveryZone)) {
    return res.status(400).json({ error: 'A valid delivery zone is required.' });
  }
  if (!PAYMENT_METHODS.includes(payment?.method)) {
    return res.status(400).json({ error: 'A valid payment method is required.' });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const orderItems = [];
    for (const item of items) {
      orderItems.push(await reserveStock(item, session));
    }

    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const deliveryCharge = getDeliveryCharge(deliveryZone);

    let coupon = null;
    let couponSnapshot = { code: '', discountAmount: 0 };
    if (couponCode) {
      const result = await checkCouponValidity(couponCode, subtotal, customer.phone, session);
      coupon = result.coupon;
      couponSnapshot = { code: coupon.code, discountAmount: result.discountAmount };

      // redeem atomically — re-checks the usage limit at write time, not just at read time above
      const redeemFilter = { _id: coupon._id };
      if (coupon.usageLimit != null) redeemFilter.usageCount = { $lt: coupon.usageLimit };
      const redeemed = await Coupon.findOneAndUpdate(
        redeemFilter,
        { $inc: { usageCount: 1 } },
        { session, new: true }
      );
      if (!redeemed) {
        const err = new Error('This coupon just reached its usage limit — please remove it and try again.');
        err.status = 409;
        throw err;
      }
    }

    const total = Math.max(0, subtotal + deliveryCharge - couponSnapshot.discountAmount);

    const orderNumber = await generateOrderNumber(session);

    const [order] = await Order.create(
      [
        {
          orderNumber,
          items: orderItems,
          customer,
          deliveryZone,
          deliveryCharge,
          payment: { method: payment.method, status: 'pending' },
          subtotal,
          coupon: couponSnapshot,
          total,
          cartSessionId: cartSessionId || '',
        },
      ],
      { session }
    );

    await session.commitTransaction();

    // Best-effort, non-transactional — a missed conversion mark only
    // affects an analytics number, not the order itself.
    if (cartSessionId) {
      CartEvent.updateMany({ sessionId: cartSessionId }, { status: 'converted' }).catch(() => { });
    }

    res.status(201).json(order);
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
});

// GET /api/orders/track?orderNumber=...&phone=... — guest order lookup
router.get('/track', async (req, res, next) => {
  try {
    const { orderNumber, phone } = req.query;
    if (!orderNumber || !phone) {
      return res.status(400).json({ error: 'Order number and phone are both required.' });
    }

    const order = await Order.findOne({ orderNumber, 'customer.phone': phone });
    if (!order) return res.status(404).json({ error: 'No matching order found.' });

    res.json(order);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders — admin, list with filters
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort('-createdAt')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Order.countDocuments(filter),
    ]);

    res.json({ orders, pagination: { page: pageNum, limit: limitNum, total } });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id — admin, detail
router.get('/:id', requireAdmin, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id/status — admin, advance/update status
router.patch('/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status, note = '' } = req.body;
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    order.status = status;
    order.statusHistory.push({ status, note, at: new Date() });

    // COD collects payment at the door, so delivery is what marks it paid.
    const isUnpaidCod = order.payment.method === 'COD' && order.payment.status === 'pending';
    if (status === 'Delivered' && isUnpaidCod) {
      order.payment.status = 'paid';
    }

    await order.save();
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id/fraud-flag — admin, mark/unmark as a suspected fake order.
// Deliberately separate from `status`: a fraud order and an ordinary
// customer-requested cancellation are both "Cancelled", but reporting
// needs to tell them apart.
router.patch('/:id/fraud-flag', requireAdmin, async (req, res, next) => {
  try {
    const { isFraudSuspected, fraudNote = '' } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { isFraudSuspected: Boolean(isFraudSuspected), fraudNote },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

export default router;
