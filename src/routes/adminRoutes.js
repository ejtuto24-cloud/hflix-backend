const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getAllUsers,
  suspendUser,
  activateUser,
  deleteUser,
  createAdminMessage,
  getAllMessages,
} = require('../controllers/adminController');
const { authenticateAdmin } = require('../middlewares/auth');

// ===== TOUTES LES ROUTES SONT PROTÉGÉES ADMIN =====

// Tableau de bord
router.get('/dashboard', authenticateAdmin, getDashboard);

// Liste des utilisateurs
router.get('/users', authenticateAdmin, getAllUsers);

// Suspendre un utilisateur
router.put('/users/:id/suspend', authenticateAdmin, suspendUser);

// Réactiver un utilisateur
router.put('/users/:id/activate', authenticateAdmin, activateUser);

// Supprimer un utilisateur
router.delete('/users/:id', authenticateAdmin, deleteUser);

// Créer un message admin
router.post('/messages', authenticateAdmin, createAdminMessage);

// Voir tous les messages
router.get('/messages', authenticateAdmin, getAllMessages);

module.exports = router;