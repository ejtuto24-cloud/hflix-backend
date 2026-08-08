const express = require('express');
const router = express.Router();
const { trackInstall, trackActivity, getInstallStats } = require('../controllers/installController');
const { authenticate, authenticateAdmin } = require('../middlewares/auth');

router.post('/track', authenticate, trackInstall);
router.post('/activity', authenticate, trackActivity);
router.get('/stats', authenticateAdmin, getInstallStats);

module.exports = router;