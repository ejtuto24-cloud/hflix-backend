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
  hideMovie,
  unhideMovie,
  deleteMovie,
} = require('../controllers/movieController');
const { authenticate, authenticateAdmin, checkSubscription } = require('../middlewares/auth');

// Routes publiques
router.get('/featured', getFeaturedMovies);

// Routes protégées
router.get('/', authenticate, getAllMovies);
router.get('/new', authenticate, checkSubscription, getNewMovies);
router.get('/popular', authenticate, checkSubscription, getPopularMovies);
router.get('/:id', authenticate, checkSubscription, getMovieById);

// Routes admin
router.post('/', authenticateAdmin, createMovie);
router.put('/:id', authenticateAdmin, updateMovie);
router.patch('/:id/hide', authenticateAdmin, hideMovie);
router.patch('/:id/unhide', authenticateAdmin, unhideMovie);
router.delete('/:id', authenticateAdmin, deleteMovie);

module.exports = router;
