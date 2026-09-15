import multer from 'multer';
import path from 'path';
import fs from 'fs';

const PRODUCTS_UPLOAD_DIR = path.join(
  process.cwd(),
  'uploads',
  'products'
);

const CATEGORIES_UPLOAD_DIR = path.join(
  process.cwd(),
  'uploads',
  'categories'
);

fs.mkdirSync(PRODUCTS_UPLOAD_DIR, { recursive: true });
fs.mkdirSync(CATEGORIES_UPLOAD_DIR, { recursive: true });

const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function fileFilter(req, file, cb) {
  if (ALLOWED.has(file.mimetype)) {
    return cb(null, true);
  }

  cb(new Error('Only JPEG, PNG, WEBP, or GIF images are allowed.'));
}

function createStorage(destinationDir) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, destinationDir),

    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(
        null,
        `${unique}${path.extname(file.originalname).toLowerCase()}`
      );
    },
  });
}

export const uploadProductImages = multer({
  storage: createStorage(PRODUCTS_UPLOAD_DIR),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 8,
  },
});

export const uploadCategoryImage = multer({
  storage: createStorage(CATEGORIES_UPLOAD_DIR),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});