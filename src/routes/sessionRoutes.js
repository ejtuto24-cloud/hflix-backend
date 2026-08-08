const express = require('express');
const router = express.Router();
const { registerSession, disconnectOtherDevices, logoutDevice } = require('../controllers/sessionController');
const { authenticate } = require('../middlewares/auth');

router.post('/register', authenticate, registerSession);
router.post('/disconnect-others', authenticate, disconnectOtherDevices);
router.post('/logout', authenticate, logoutDevice);

module.exports = router;