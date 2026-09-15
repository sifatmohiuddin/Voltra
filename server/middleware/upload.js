import multer from 'multer';

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

const memoryStorage = multer.memoryStorage();

export const uploadProductImages = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 8,
  },
});

export const uploadCategoryImage = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});