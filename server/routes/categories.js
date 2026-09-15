import { Router } from 'express';
import slugify from 'slugify';
import Category from '../models/Category.js';
import { requireAdmin } from '../middleware/auth.js';
import { uploadCategoryImage } from '../middleware/upload.js';
import cloudinary from '../config/cloudinary.js';

const router = Router();

// GET /api/categories
router.get('/', async (req, res, next) => {
  try {
    const filter =
      req.query.includeInactive === 'true'
        ? {}
        : { isActive: true };

    const categories = await Category.find(filter).sort('name');

    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// POST /api/categories
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const {
      name,
      description,
      image,
      parent,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Category name is required.',
      });
    }

    const category = await Category.create({
      name,
      slug: slugify(name, {
        lower: true,
        strict: true,
      }),
      description,
      image,
      parent: parent || null,
    });

    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

// PUT /api/categories/:id
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const {
      name,
      description,
      image,
      parent,
      isActive,
    } = req.body;

    const update = {
      description,
      parent: parent || null,
      isActive,
    };

    if (name) {
      update.name = name;
      update.slug = slugify(name, {
        lower: true,
        strict: true,
      });
    }

    if (image !== undefined) {
      update.image = image;
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      update,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!category) {
      return res.status(404).json({
        error: 'Category not found.',
      });
    }

    res.json(category);
  } catch (err) {
    next(err);
  }
});

// POST /api/categories/:id/image
router.post(
  '/:id/image',
  requireAdmin,
  uploadCategoryImage.single('image'),
  async (req, res, next) => {
    try {
      const category = await Category.findById(req.params.id);

      if (!category) {
        return res.status(404).json({
          error: 'Category not found.',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: 'Category image is required.',
        });
      }

      // Delete old Cloudinary image if there is one.
      if (
        category.image &&
        category.image.includes('res.cloudinary.com')
      ) {
        try {
          const parts = category.image.split('/upload/')[1];

          if (parts) {
            const withoutVersion = parts.replace(/^v\d+\//, '');
            const publicId = withoutVersion
              .replace(/\.[^/.]+$/, '');

            await cloudinary.uploader.destroy(publicId);
          }
        } catch (cloudinaryError) {
          console.error(
            'Old category image deletion failed:',
            cloudinaryError
          );
        }
      }

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'voltra/categories',
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

        uploadStream.end(req.file.buffer);
      });

      category.image = result.secure_url;

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

// DELETE /api/categories/:id/image
router.delete('/:id/image', requireAdmin, async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        error: 'Category not found.',
      });
    }

    const oldImage = category.image;

    category.image = '';

    await category.save();

    // Delete from Cloudinary.
    if (
      oldImage &&
      oldImage.includes('res.cloudinary.com')
    ) {
      try {
        const parts = oldImage.split('/upload/')[1];

        if (parts) {
          const withoutVersion = parts.replace(/^v\d+\//, '');
          const publicId = withoutVersion
            .replace(/\.[^/.]+$/, '');

          await cloudinary.uploader.destroy(publicId);
        }
      } catch (cloudinaryError) {
        console.error(
          'Cloudinary category image deletion failed:',
          cloudinaryError
        );
      }
    }

    res.json({
      image: '',
      category,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/categories/:id
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        error: 'Category not found.',
      });
    }

    res.json({
      message: 'Category deleted.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;