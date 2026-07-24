const express = require('express');
const router = express.Router();
const {
  addToFavorites,
  removeFromFavorites,
  getMyFavorites,
  addToHistory,
  getMyHistory,
  saveProgress,
  getProgress,
  getContinueWatching,
} = require('../controllers/userController');
const { authenticate, checkSubscription } = require('../middlewares/auth');

// ===== FAVORIS =====

// Voir mes favoris
router.get('/favorites', authenticate, checkSubscription, getMyFavorites);

// Ajouter aux favoris
router.post('/favorites/:movieId', authenticate, checkSubscription, addToFavorites);

// Retirer des favoris
router.delete('/favorites/:movieId', authenticate, checkSubscription, removeFromFavorites);

// ===== HISTORIQUE =====

// Voir mon historique
router.get('/history', authenticate, checkSubscription, getMyHistory);

// Ajouter à l'historique
router.post('/history/:movieId', authenticate, checkSubscription, addToHistory);

// ===== PROGRESSION =====

// Récupérer la progression d'un film
router.get('/progress/:movieId', authenticate, checkSubscription, getProgress);

// Sauvegarder la progression
router.post('/progress/:movieId', authenticate, checkSubscription, saveProgress);

// Continuer à regarder
router.get('/continue-watching', authenticate, checkSubscription, getContinueWatching);

module.exports = router;