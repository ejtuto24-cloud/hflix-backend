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
const storage = multer.memoryStorage();

const uploadVideoFile = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 * 1024 },
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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers image sont acceptés.'));
    }
  },
});

// ===== PREUVE DE PAIEMENT : IMAGE OU PDF =====
const uploadProofFile = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'application/pdf',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format non accepté. Utilisez JPG, PNG, WEBP ou PDF.'));
    }
  },
});

// ===== ROUTES ADMIN =====
router.post('/video/:movieId', authenticateAdmin, uploadVideoFile.single('video'), uploadVideo);
router.post('/thumbnail/:movieId', authenticateAdmin, uploadImageFile.single('thumbnail'), uploadThumbnail);
router.post('/banner/:movieId', authenticateAdmin, uploadImageFile.single('banner'), uploadBanner);

// ===== ROUTES UTILISATEUR =====
router.post('/proof/:paymentId', authenticate, uploadProofFile.single('proof'), uploadPaymentScreenshot);

module.exports = router;