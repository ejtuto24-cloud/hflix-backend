const express = require('express');
const router = express.Router();
const {
  saveAnalytics,
  getMovieAnalytics,
  getGlobalAnalytics,
} = require('../controllers/analyticsController');
const { authenticate, authenticateAdmin } = require('../middlewares/auth');

// Sauvegarder analytics (utilisateur)
router.post('/movie/:movieId', authenticate, saveAnalytics);

// Analytics d'un film (admin)
router.get('/movie/:movieId', authenticateAdmin, getMovieAnalytics);

// Analytics globales (admin)
router.get('/global', authenticateAdmin, getGlobalAnalytics);

module.exports = router;