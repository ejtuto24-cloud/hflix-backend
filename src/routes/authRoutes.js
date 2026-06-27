const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

// ===== ROUTES PUBLIQUES =====

// Créer un compte
router.post('/register', register);

// Se connecter
router.post('/login', login);

// ===== ROUTES PROTÉGÉES =====

// Voir mon profil
router.get('/profile', authenticate, getProfile);

// Modifier mon profil
router.put('/profile', authenticate, updateProfile);

// Changer mot de passe
router.put('/change-password', authenticate, changePassword);

// Supprimer mon compte
router.delete('/delete-account', authenticate, deleteAccount);

module.exports = router;