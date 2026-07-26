const express = require('express');
const router = express.Router();
const { likeMovie, checkLike, getMyLikes } = require('../controllers/likeController');
const { authenticate } = require('../middlewares/auth');

router.post('/:movieId', authenticate, likeMovie);
router.get('/:movieId/status', authenticate, checkLike);
router.get('/my/likes', authenticate, getMyLikes);

module.exports = router;