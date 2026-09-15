import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import slugify from 'slugify';
import Product from '../models/Product.js';
import { requireAdmin } from '../middleware/auth.js';
import { uploadProductImages } from '../middleware/upload.js';

const router = Router();
router.use(requireAdmin);

// GET /api/admin/products — includes drafts/archived, simple search + pagination
router.get('/', async (req, res, next) => {
  try {
    const { q, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (q) filter.$text = { $search: q };

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name')
        .sort('-createdAt')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.json({ products, pagination: { page: pageNum, limit: limitNum, total } });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/products/:id — single product, for the edit form
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/products
router.post('/', async (req, res, next) => {
  try {
    const body = req.body;
    if (!body.name || !body.category || body.basePrice == null) {
      return res.status(400).json({ error: 'Name, category, and basePrice are required.' });
    }

    const product = await Product.create({
      ...body,
      slug: slugify(body.name, { lower: true, strict: true }),
    });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/products/:id
router.put('/:id', async (req, res, next) => {
  try {
    const body = req.body;
    const update = { ...body };
    if (body.name) update.slug = slugify(body.name, { lower: true, strict: true });

    const product = await Product.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/products/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/products/:id/images — multipart upload, appends to images[]
router.post('/:id/images', uploadProductImages.array('images', 8), async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    const urls = (req.files || []).map((f) => `/uploads/products/${f.filename}`);
    product.images.push(...urls);
    await product.save();

    res.status(201).json({ images: product.images });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/products/:id/images — body: { url }
router.delete('/:id/images', async (req, res, next) => {
  try {
    const { url } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    product.images = product.images.filter((img) => img !== url);
    await product.save();

    // best-effort cleanup of the file on disk
    if (url?.startsWith('/uploads/products/')) {
      const filePath = path.join(process.cwd(), url);
      fs.unlink(filePath, () => {});
    }

    res.json({ images: product.images });
  } catch (err) {
    next(err);
  }
});

export default router;
