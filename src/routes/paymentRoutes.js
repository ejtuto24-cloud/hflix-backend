const express = require('express');
const router = express.Router();
const {
  createPayment,
  uploadScreenshot,
  getMyPayments,
  getAllPayments,
  approvePayment,
  rejectPayment,
} = require('../controllers/paymentController');
const { authenticate, authenticateAdmin } = require('../middlewares/auth');

// ===== ROUTES UTILISATEUR =====

// Faire une demande de paiement
router.post('/', authenticate, createPayment);

// Uploader la capture d'écran
router.put('/:id/screenshot', authenticate, uploadScreenshot);

// Voir mes paiements
router.get('/my', authenticate, getMyPayments);

// ===== ROUTES ADMIN =====

// Voir tous les paiements
router.get('/', authenticateAdmin, getAllPayments);

// Approuver un paiement
router.put('/:id/approve', authenticateAdmin, approvePayment);

// Refuser un paiement
router.put('/:id/reject', authenticateAdmin, rejectPayment);

module.exports = router;