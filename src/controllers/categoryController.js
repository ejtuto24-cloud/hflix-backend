const { prisma } = require('../config/database');
const {
  successResponse,
  errorResponse,
  validationError,
  notFoundResponse,
} = require('../utils/response');

// ===== TOUTES LES CATÉGORIES =====
const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { movies: true },
        },
      },
    });

    return successResponse(res, { categories }, 'Catégories récupérées avec succès.');

  } catch (error) {
    console.error('Erreur getAllCategories:', error);
    return errorResponse(res, 'Erreur lors de la récupération des catégories.');
  }
};

// ===== UNE SEULE CATÉGORIE =====
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        movies: {
          where: { isPublished: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!category) {
      return notFoundResponse(res, 'Catégorie non trouvée.');
    }

    return successResponse(res, { category }, 'Catégorie récupérée avec succès.');

  } catch (error) {
    console.error('Erreur getCategoryById:', error);
    return errorResponse(res, 'Erreur lors de la récupération de la catégorie.');
  }
};

// ===== CRÉER UNE CATÉGORIE (ADMIN) =====
const createCategory = async (req, res) => {
  try {
    const { name, description, image } = req.body;

    if (!name) {
      return validationError(res, 'Le nom de la catégorie est obligatoire.');
    }

    const existingCategory = await prisma.category.findUnique({
      where: { name },
    });

    if (existingCategory) {
      return validationError(res, 'Cette catégorie existe déjà.');
    }

    const category = await prisma.category.create({
      data: { name, description, image },
    });

    return successResponse(res, { category }, 'Catégorie créée avec succès.', 201);

  } catch (error) {
    console.error('Erreur createCategory:', error);
    return errorResponse(res, 'Erreur lors de la création de la catégorie.');
  }
};

// ===== MODIFIER UNE CATÉGORIE (ADMIN) =====
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image } = req.body;

    const existingCategory = await prisma.category.findUnique({ where: { id } });

    if (!existingCategory) {
      return notFoundResponse(res, 'Catégorie non trouvée.');
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name, description, image },
    });

    return successResponse(res, { category }, 'Catégorie mise à jour avec succès.');

  } catch (error) {
    console.error('Erreur updateCategory:', error);
    return errorResponse(res, 'Erreur lors de la mise à jour de la catégorie.');
  }
};

// ===== SUPPRIMER UNE CATÉGORIE (ADMIN) =====
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const existingCategory = await prisma.category.findUnique({ where: { id } });

    if (!existingCategory) {
      return notFoundResponse(res, 'Catégorie non trouvée.');
    }

    await prisma.category.delete({ where: { id } });

    return successResponse(res, {}, 'Catégorie supprimée avec succès.');

  } catch (error) {
    console.error('Erreur deleteCategory:', error);
    return errorResponse(res, 'Erreur lors de la suppression de la catégorie.');
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};