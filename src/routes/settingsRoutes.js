const express = require('express');
const router = express.Router();
const {
  getSubscriptionPrice,
  getAllSettings,
  updateSettings,
} = require('../controllers/settingsController');
const { authenticate, authenticateAdmin } = require('../middlewares/auth');

// Route utilisateur : obtenir le prix
router.get('/price', authenticate, getSubscriptionPrice);

// Routes admin
router.get('/', authenticateAdmin, getAllSettings);
router.put('/', authenticateAdmin, updateSettings);

module.exports = router;