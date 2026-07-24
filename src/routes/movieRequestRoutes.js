const express = require('express');
const router = express.Router();
const {
  createRequest,
  getMyRequests,
  getAllRequests,
  approveRequest,
  rejectRequest,
} = require('../controllers/movieRequestController');
const { authenticate, authenticateAdmin } = require('../middlewares/auth');

// Routes utilisateur
router.post('/', authenticate, createRequest);
router.get('/my', authenticate, getMyRequests);

// Routes admin
router.get('/', authenticateAdmin, getAllRequests);
router.put('/:id/approve', authenticateAdmin, approveRequest);
router.put('/:id/reject', authenticateAdmin, rejectRequest);

module.exports = router;
