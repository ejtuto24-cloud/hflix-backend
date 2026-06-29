const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  uploadVideo,
  uploadThumbnail,
  uploadBanner,
  uploadPaymentScreenshot,
} = require('../controllers/uploadController');
const { authenticate, authenticateAdmin } = require('../middlewares/auth');

// ===== CONFIGURATION MULTER =====
// Multer garde les fichiers en mémoire avant de les envoyer à R2
const storage = multer.memoryStorage();

const uploadVideoFile = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5GB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers vidéo sont acceptés.'));
    }
  },
});

const uploadImageFile = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers image sont acceptés.'));
    }
  },
});

const uploadScreenshotFile = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers image sont acceptés.'));
    }
  },
});

// ===== ROUTES ADMIN =====

// Uploader une vidéo
router.post(
  '/video/:movieId',
  authenticateAdmin,
  uploadVideoFile.single('video'),
  uploadVideo
);

// Uploader une miniature
router.post(
  '/thumbnail/:movieId',
  authenticateAdmin,
  uploadImageFile.single('thumbnail'),
  uploadThumbnail
);

// Uploader une bannière
router.post(
  '/banner/:movieId',
  authenticateAdmin,
  uploadImageFile.single('banner'),
  uploadBanner
);

// ===== ROUTES UTILISATEUR =====

// Uploader une capture d'écran de paiement
router.post(
  '/screenshot/:paymentId',
  authenticate,
  uploadScreenshotFile.single('screenshot'),
  uploadPaymentScreenshot
);

module.exports = router;