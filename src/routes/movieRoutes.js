const express = require('express');
const router = express.Router();
const {
  getAllMovies,
  getMovieById,
  getPopularMovies,
  getNewMovies,
  getFeaturedMovies,
  createMovie,
  updateMovie,
  deleteMovie,
} = require('../controllers/movieController');
const { authenticate, authenticateAdmin, checkSubscription } = require('../middlewares/auth');

// ===== ROUTES PUBLIQUES =====

// Films en vedette
router.get('/featured', getFeaturedMovies);

// ===== ROUTES PROTÉGÉES (abonnement requis) =====

// Tous les films
router.get('/', authenticate, getAllMovies);
// Nouveautés
router.get('/new', authenticate, checkSubscription, getNewMovies);

// Films populaires
router.get('/popular', authenticate, checkSubscription, getPopularMovies);

// Un seul film
router.get('/:id', authenticate, checkSubscription, getMovieById);

// ===== ROUTES ADMIN =====

// Ajouter un film
router.post('/', authenticateAdmin, createMovie);

// Modifier un film
router.put('/:id', authenticateAdmin, updateMovie);

// Supprimer un film
router.delete('/:id', authenticateAdmin, deleteMovie);

module.exports = router;