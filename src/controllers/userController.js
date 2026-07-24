const { prisma } = require('../config/database');
const {
  successResponse,
  errorResponse,
  notFoundResponse,
} = require('../utils/response');

// ===== AJOUTER AUX FAVORIS =====
const addToFavorites = async (req, res) => {
  try {
    const { movieId } = req.params;

    const movie = await prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) {
      return notFoundResponse(res, 'Film non trouvé.');
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_movieId: {
          userId: req.user.id,
          movieId,
        },
      },
    });

    if (existing) {
      return errorResponse(res, 'Film déjà dans les favoris.', 400);
    }

    await prisma.favorite.create({
      data: {
        userId: req.user.id,
        movieId,
      },
    });

    return successResponse(res, {}, 'Film ajouté aux favoris.');

  } catch (error) {
    console.error('Erreur addToFavorites:', error);
    return errorResponse(res, 'Erreur lors de l\'ajout aux favoris.');
  }
};

// ===== RETIRER DES FAVORIS =====
const removeFromFavorites = async (req, res) => {
  try {
    const { movieId } = req.params;

    await prisma.favorite.deleteMany({
      where: {
        userId: req.user.id,
        movieId,
      },
    });

    return successResponse(res, {}, 'Film retiré des favoris.');

  } catch (error) {
    console.error('Erreur removeFromFavorites:', error);
    return errorResponse(res, 'Erreur lors du retrait des favoris.');
  }
};

// ===== MES FAVORIS =====
const getMyFavorites = async (req, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        movie: {
          include: {
            category: { select: { id: true, name: true } },
          },
        },
      },
    });

    const movies = favorites.map(f => f.movie);

    return successResponse(res, { movies }, 'Favoris récupérés avec succès.');

  } catch (error) {
    console.error('Erreur getMyFavorites:', error);
    return errorResponse(res, 'Erreur lors de la récupération des favoris.');
  }
};

// ===== AJOUTER À L'HISTORIQUE =====
const addToHistory = async (req, res) => {
  try {
    const { movieId } = req.params;

    await prisma.watchHistory.upsert({
      where: {
        userId_movieId: {
          userId: req.user.id,
          movieId,
        },
      },
      update: {
        watchedAt: new Date(),
      },
      create: {
        userId: req.user.id,
        movieId,
      },
    });

    return successResponse(res, {}, 'Historique mis à jour.');

  } catch (error) {
    console.error('Erreur addToHistory:', error);
    return errorResponse(res, 'Erreur lors de la mise à jour de l\'historique.');
  }
};

// ===== MON HISTORIQUE =====
const getMyHistory = async (req, res) => {
  try {
    const history = await prisma.watchHistory.findMany({
      where: { userId: req.user.id },
      orderBy: { watchedAt: 'desc' },
      take: 20,
      include: {
        movie: {
          include: {
            category: { select: { id: true, name: true } },
          },
        },
      },
    });

    const movies = history.map(h => h.movie);

    return successResponse(res, { movies }, 'Historique récupéré avec succès.');

  } catch (error) {
    console.error('Erreur getMyHistory:', error);
    return errorResponse(res, 'Erreur lors de la récupération de l\'historique.');
  }
};

// ===== SAUVEGARDER PROGRESSION =====
const saveProgress = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { progress, duration } = req.body;

    await prisma.watchProgress.upsert({
      where: {
        userId_movieId: {
          userId: req.user.id,
          movieId,
        },
      },
      update: {
        progress: parseInt(progress),
        duration: parseInt(duration),
      },
      create: {
        userId: req.user.id,
        movieId,
        progress: parseInt(progress),
        duration: parseInt(duration),
      },
    });

    return successResponse(res, {}, 'Progression sauvegardée.');

  } catch (error) {
    console.error('Erreur saveProgress:', error);
    return errorResponse(res, 'Erreur lors de la sauvegarde de la progression.');
  }
};

// ===== RÉCUPÉRER PROGRESSION =====
const getProgress = async (req, res) => {
  try {
    const { movieId } = req.params;

    const progress = await prisma.watchProgress.findUnique({
      where: {
        userId_movieId: {
          userId: req.user.id,
          movieId,
        },
      },
    });

    return successResponse(res, { progress }, 'Progression récupérée.');

  } catch (error) {
    console.error('Erreur getProgress:', error);
    return errorResponse(res, 'Erreur lors de la récupération de la progression.');
  }
};

// ===== CONTINUER À REGARDER =====
const getContinueWatching = async (req, res) => {
  try {
    const progresses = await prisma.watchProgress.findMany({
      where: {
        userId: req.user.id,
        progress: { gt: 0 },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        movie: {
          include: {
            category: { select: { id: true, name: true } },
          },
        },
      },
    });

    return successResponse(res, { progresses }, 'Continuer à regarder récupéré.');

  } catch (error) {
    console.error('Erreur getContinueWatching:', error);
    return errorResponse(res, 'Erreur lors de la récupération.');
  }
};

module.exports = {
  addToFavorites,
  removeFromFavorites,
  getMyFavorites,
  addToHistory,
  getMyHistory,
  saveProgress,
  getProgress,
  getContinueWatching,
};