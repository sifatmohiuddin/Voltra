import { Router } from 'express';
import slugify from 'slugify';
import Product from '../models/Product.js';
import { requireAdmin } from '../middleware/auth.js';
import { uploadProductImages } from '../middleware/upload.js';
import cloudinary from '../config/cloudinary.js';

const router = Router();

router.use(requireAdmin);

// GET /api/admin/products
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

    res.json({
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name');

    if (!product) {
      return res.status(404).json({
        error: 'Product not found.',
      });
    }

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
      return res.status(400).json({
        error: 'Name, category, and basePrice are required.',
      });
    }

    const product = await Product.create({
      ...body,
      slug: slugify(body.name, {
        lower: true,
        strict: true,
      }),
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

    if (body.name) {
      update.slug = slugify(body.name, {
        lower: true,
        strict: true,
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      update,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        error: 'Product not found.',
      });
    }

    res.json(product);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/products/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        error: 'Product not found.',
      });
    }

    res.json({
      message: 'Product deleted.',
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/products/:id/images
router.post(
  '/:id/images',
  uploadProductImages.array('images', 8),
  async (req, res, next) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          error: 'Product not found.',
        });
      }

      if (!req.files?.length) {
        return res.status(400).json({
          error: 'At least one image is required.',
        });
      }

      const uploadedImages = [];

      for (const file of req.files) {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'voltra/products',
              resource_type: 'image',
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );

          uploadStream.end(file.buffer);
        });

        uploadedImages.push({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }

      product.images.push(...uploadedImages.map((image) => image.url));

      await product.save();

      res.status(201).json({
        images: product.images,
        uploaded: uploadedImages,
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/admin/products/:id/images
router.delete('/:id/images', async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        error: 'Image URL is required.',
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        error: 'Product not found.',
      });
    }

    product.images = product.images.filter((img) => img !== url);

    await product.save();

    // Delete from Cloudinary if this is a Cloudinary image.
    if (url.includes('res.cloudinary.com')) {
      try {
        const parts = url.split('/upload/')[1];

        if (parts) {
          const withoutVersion = parts.replace(/^v\d+\//, '');
          const publicId = withoutVersion
            .replace(/\.[^/.]+$/, '');

          await cloudinary.uploader.destroy(publicId);
        }
      } catch (cloudinaryError) {
        console.error(
          'Cloudinary image deletion failed:',
          cloudinaryError
        );
      }
    }

    res.json({
      images: product.images,
    });
  } catch (err) {
    next(err);
  }
});

export default router;