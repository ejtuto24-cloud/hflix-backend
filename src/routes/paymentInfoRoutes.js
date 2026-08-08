const express = require('express');
const router = express.Router();
const {
  getPaymentInfo,
  upsertPaymentInfo,
  deletePaymentInfo,
} = require('../controllers/paymentInfoController');
const { authenticate, authenticateAdmin } = require('../middlewares/auth');

// Route publique pour les utilisateurs connectés
router.get('/', authenticate, getPaymentInfo);

// Routes admin
router.post('/', authenticateAdmin, upsertPaymentInfo);
router.delete('/:method', authenticateAdmin, deletePaymentInfo);

module.exports = router;