const express = require('express');
const router = express.Router();
const {
  getActiveAnnouncements,
  trackView,
  trackClick,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} = require('../controllers/announcementController');
const { authenticate, authenticateAdmin } = require('../middlewares/auth');

// ===== ROUTES UTILISATEUR =====
router.get('/active', authenticate, getActiveAnnouncements);
router.post('/:id/view', authenticate, trackView);
router.post('/:id/click', authenticate, trackClick);
router.get('/banners/active', authenticate, getActiveBanners);

// ===== ROUTES ADMIN - ANNONCES =====
router.get('/', authenticateAdmin, getAllAnnouncements);
router.post('/', authenticateAdmin, createAnnouncement);
router.put('/:id', authenticateAdmin, updateAnnouncement);
router.delete('/:id', authenticateAdmin, deleteAnnouncement);

// ===== ROUTES ADMIN - BANNIÈRES =====
router.get('/banners/all', authenticateAdmin, getAllBanners);
router.post('/banners', authenticateAdmin, createBanner);
router.put('/banners/:id', authenticateAdmin, updateBanner);
router.delete('/banners/:id', authenticateAdmin, deleteBanner);

module.exports = router;