import { Router } from 'express';
import slugify from 'slugify';
import Category from '../models/Category.js';
import { requireAdmin } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { uploadCategoryImage } from '../middleware/upload.js';


const router = Router();

// GET /api/categories — public (pass ?includeInactive=true to see disabled ones, e.g. from the admin panel)
router.get('/', async (req, res, next) => {
  try {
    const filter = req.query.includeInactive === 'true' ? {} : { isActive: true };
    const categories = await Category.find(filter).sort('name');
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// POST /api/categories — admin
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { name, description, image, parent } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required.' });

    const category = await Category.create({
      name,
      slug: slugify(name, { lower: true, strict: true }),
      description,
      image,
      parent: parent || null,
    });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

// PUT /api/categories/:id — admin
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { name, description, image, parent, isActive } = req.body;

    const update = {
      description,
      parent: parent || null,
      isActive,
    };

    if (image !== undefined) {
      update.image = image;
    }

    const category = await Category.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!category) return res.status(404).json({ error: 'Category not found.' });
    res.json(category);
  } catch (err) {
    next(err);
  }
});

// POST /api/categories/:id/image — admin
router.post(
  '/:id/image',
  requireAdmin,
  uploadCategoryImage.single('image'),
  async (req, res, next) => {
    try {
      const category = await Category.findById(req.params.id);

      if (!category) {
        return res.status(404).json({ error: 'Category not found.' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Category image is required.' });
      }

      // Delete previous image if it belongs to our uploads
      if (category.image?.startsWith('/uploads/categories/')) {
        const oldPath = path.join(process.cwd(), category.image);
        fs.unlink(oldPath, () => { });
      }

      category.image = `/uploads/categories/${req.file.filename}`;

      await category.save();

      res.status(201).json({
        image: category.image,
        category,
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/categories/:id/image — admin
router.delete('/:id/image', requireAdmin, async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const oldImage = category.image;

    category.image = '';
    await category.save();

    if (oldImage?.startsWith('/uploads/categories/')) {
      const filePath = path.join(process.cwd(), oldImage);
      fs.unlink(filePath, () => { });
    }

    res.json({
      image: '',
      category,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/categories/:id — admin
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found.' });
    res.json({ message: 'Category deleted.' });
  } catch (err) {
    next(err);
  }
});

export default router;
