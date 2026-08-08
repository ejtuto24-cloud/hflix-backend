const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { authenticate, authenticateAdmin } = require('../middlewares/auth');

// ===== ROUTES PUBLIQUES =====

// Toutes les catégories
router.get('/', getAllCategories);

// Une seule catégorie avec ses films
router.get('/:id', authenticate, getCategoryById);

// ===== ROUTES ADMIN =====

// Créer une catégorie
router.post('/', authenticateAdmin, createCategory);

// Modifier une catégorie
router.put('/:id', authenticateAdmin, updateCategory);

// Supprimer une catégorie
router.delete('/:id', authenticateAdmin, deleteCategory);

module.exports = router;