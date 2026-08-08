const express = require('express');
const router = express.Router();
const {
  getAllSeries,
  getSerieById,
  createSerie,
  updateSerie,
  hideSerie,
  unhideSerie,
  deleteSerie,
  createSeason,
  createEpisode,
  updateEpisode,
  deleteEpisode,
  getNextEpisode,
  getSuggestedSeries,
} = require('../controllers/serieController');
const { authenticate, authenticateAdmin, checkSubscription } = require('../middlewares/auth');

// ===== ROUTES UTILISATEUR =====
router.get('/', authenticate, checkSubscription, getAllSeries);
router.get('/:id', authenticate, checkSubscription, getSerieById);
router.get('/:serieId/suggested', authenticate, checkSubscription, getSuggestedSeries);
router.get('/episode/:episodeId/next', authenticate, checkSubscription, getNextEpisode);

// ===== ROUTES ADMIN =====
router.post('/', authenticateAdmin, createSerie);
router.put('/:id', authenticateAdmin, updateSerie);
router.patch('/:id/hide', authenticateAdmin, hideSerie);
router.patch('/:id/unhide', authenticateAdmin, unhideSerie);
router.delete('/:id', authenticateAdmin, deleteSerie);

// Saisons
router.post('/:serieId/seasons', authenticateAdmin, createSeason);

// Épisodes
router.post('/seasons/:seasonId/episodes', authenticateAdmin, createEpisode);
router.put('/episodes/:episodeId', authenticateAdmin, updateEpisode);
router.delete('/episodes/:episodeId', authenticateAdmin, deleteEpisode);

module.exports = router;
