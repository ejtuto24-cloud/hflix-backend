const { prisma } = require('../config/database');
const {
  successResponse,
  errorResponse,
  validationError,
  notFoundResponse,
} = require('../utils/response');

// ===== TOUTES LES SÉRIES =====
const getAllSeries = async (req, res) => {
  try {
    const { category } = req.query;
    const where = { isPublished: true, isHidden: false };
    if (category) where.categoryId = category;

    const series = await prisma.serie.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { seasons: true } },
      },
    });

    return successResponse(res, { series }, 'Séries récupérées avec succès.');
  } catch (error) {
    console.error('Erreur getAllSeries:', error);
    return errorResponse(res, 'Erreur lors de la récupération des séries.');
  }
};

// ===== UNE SÉRIE AVEC SES SAISONS ET ÉPISODES =====
const getSerieById = async (req, res) => {
  try {
    const { id } = req.params;

    const serie = await prisma.serie.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        seasons: {
          orderBy: { number: 'asc' },
          include: {
            episodes: {
              orderBy: { number: 'asc' },
            },
          },
        },
      },
    });

    if (!serie) return notFoundResponse(res, 'Série non trouvée.');
    if (serie.isHidden) return notFoundResponse(res, 'Série non disponible.');

    return successResponse(res, { serie }, 'Série récupérée avec succès.');
  } catch (error) {
    console.error('Erreur getSerieById:', error);
    return errorResponse(res, 'Erreur lors de la récupération de la série.');
  }
};

// ===== CRÉER UNE SÉRIE (ADMIN) =====
const createSerie = async (req, res) => {
  try {
    const { title, description, categoryId, thumbnail, banner, releaseYear, isFeatured } = req.body;

    if (!title || !categoryId) {
      return validationError(res, 'Le titre et la catégorie sont obligatoires.');
    }

    const serie = await prisma.serie.create({
      data: {
        title, description, categoryId,
        thumbnail, banner,
        releaseYear: releaseYear ? parseInt(releaseYear) : null,
        isFeatured: isFeatured || false,
        isPublished: true,
        isHidden: false,
      },
      include: { category: { select: { id: true, name: true } } },
    });

    return successResponse(res, { serie }, 'Série créée avec succès.', 201);
  } catch (error) {
    console.error('Erreur createSerie:', error);
    return errorResponse(res, 'Erreur lors de la création de la série.');
  }
};

// ===== MODIFIER UNE SÉRIE (ADMIN) =====
const updateSerie = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, categoryId, thumbnail, banner, releaseYear, isFeatured, isPublished } = req.body;

    const serie = await prisma.serie.update({
      where: { id },
      data: {
        title, description, categoryId,
        thumbnail, banner,
        releaseYear: releaseYear ? parseInt(releaseYear) : undefined,
        isFeatured, isPublished,
      },
      include: { category: { select: { id: true, name: true } } },
    });

    return successResponse(res, { serie }, 'Série mise à jour avec succès.');
  } catch (error) {
    console.error('Erreur updateSerie:', error);
    return errorResponse(res, 'Erreur lors de la mise à jour.');
  }
};

// ===== CACHER/AFFICHER UNE SÉRIE (ADMIN) =====
const hideSerie = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.serie.update({ where: { id }, data: { isHidden: true } });
    return successResponse(res, {}, 'Série cachée avec succès.');
  } catch (error) {
    return errorResponse(res, 'Erreur.');
  }
};

const unhideSerie = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.serie.update({ where: { id }, data: { isHidden: false } });
    return successResponse(res, {}, 'Série affichée avec succès.');
  } catch (error) {
    return errorResponse(res, 'Erreur.');
  }
};

// ===== SUPPRIMER UNE SÉRIE (ADMIN) =====
const deleteSerie = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.serie.delete({ where: { id } });
    return successResponse(res, {}, 'Série supprimée avec succès.');
  } catch (error) {
    console.error('Erreur deleteSerie:', error);
    return errorResponse(res, 'Erreur lors de la suppression.');
  }
};

// ===== AJOUTER UNE SAISON (ADMIN) =====
const createSeason = async (req, res) => {
  try {
    const { serieId } = req.params;
    const { number, title } = req.body;

    if (!number) {
      return validationError(res, 'Le numéro de saison est obligatoire.');
    }

    const season = await prisma.season.create({
      data: { serieId, number: parseInt(number), title },
    });

    return successResponse(res, { season }, 'Saison créée avec succès.', 201);
  } catch (error) {
    console.error('Erreur createSeason:', error);
    return errorResponse(res, 'Erreur lors de la création de la saison.');
  }
};

// ===== AJOUTER UN ÉPISODE (ADMIN) =====
const createEpisode = async (req, res) => {
  try {
    const { seasonId } = req.params;
    const { number, title, description, videoUrl, thumbnail, duration } = req.body;

    if (!number || !title) {
      return validationError(res, 'Le numéro et le titre sont obligatoires.');
    }

    const episode = await prisma.episode.create({
      data: {
        seasonId,
        number: parseInt(number),
        title, description,
        videoUrl, thumbnail,
        duration: duration ? parseInt(duration) : null,
      },
    });

    return successResponse(res, { episode }, 'Épisode créé avec succès.', 201);
  } catch (error) {
    console.error('Erreur createEpisode:', error);
    return errorResponse(res, 'Erreur lors de la création de l\'épisode.');
  }
};

// ===== MODIFIER UN ÉPISODE (ADMIN) =====
const updateEpisode = async (req, res) => {
  try {
    const { episodeId } = req.params;
    const { number, title, description, videoUrl, thumbnail, duration } = req.body;

    const episode = await prisma.episode.update({
      where: { id: episodeId },
      data: {
        number: number ? parseInt(number) : undefined,
        title, description, videoUrl, thumbnail,
        duration: duration ? parseInt(duration) : undefined,
      },
    });

    return successResponse(res, { episode }, 'Épisode mis à jour avec succès.');
  } catch (error) {
    console.error('Erreur updateEpisode:', error);
    return errorResponse(res, 'Erreur lors de la mise à jour.');
  }
};

// ===== SUPPRIMER UN ÉPISODE (ADMIN) =====
const deleteEpisode = async (req, res) => {
  try {
    const { episodeId } = req.params;
    await prisma.episode.delete({ where: { id: episodeId } });
    return successResponse(res, {}, 'Épisode supprimé avec succès.');
  } catch (error) {
    console.error('Erreur deleteEpisode:', error);
    return errorResponse(res, 'Erreur lors de la suppression.');
  }
};

// ===== ÉPISODE SUIVANT =====
const getNextEpisode = async (req, res) => {
  try {
    const { episodeId } = req.params;

    const currentEpisode = await prisma.episode.findUnique({
      where: { id: episodeId },
      include: { season: { include: { serie: { include: { seasons: { include: { episodes: { orderBy: { number: 'asc' } } }, orderBy: { number: 'asc' } } } } } } },
    });

    if (!currentEpisode) return notFoundResponse(res, 'Épisode non trouvé.');

    const allSeasons = currentEpisode.season.serie.seasons;
    let nextEpisode = null;

    for (const season of allSeasons) {
      for (const episode of season.episodes) {
        if (episode.id === episodeId) continue;
        if (season.number > currentEpisode.season.number ||
          (season.number === currentEpisode.season.number && episode.number > currentEpisode.number)) {
          if (!nextEpisode ||
            season.number < allSeasons.find(s => s.episodes.some(e => e.id === nextEpisode.id))?.number ||
            episode.number < nextEpisode.number) {
            nextEpisode = episode;
          }
        }
      }
    }

    return successResponse(res, { nextEpisode }, 'Épisode suivant récupéré.');
  } catch (error) {
    console.error('Erreur getNextEpisode:', error);
    return errorResponse(res, 'Erreur.');
  }
};

// ===== SÉRIES SUGGÉRÉES =====
const getSuggestedSeries = async (req, res) => {
  try {
    const { serieId } = req.params;

    const serie = await prisma.serie.findUnique({ where: { id: serieId } });
    if (!serie) return notFoundResponse(res, 'Série non trouvée.');

    const suggested = await prisma.serie.findMany({
      where: {
        categoryId: serie.categoryId,
        id: { not: serieId },
        isPublished: true,
        isHidden: false,
      },
      take: 5,
      include: { category: { select: { id: true, name: true } } },
    });

    return successResponse(res, { suggested }, 'Séries suggérées récupérées.');
  } catch (error) {
    console.error('Erreur getSuggestedSeries:', error);
    return errorResponse(res, 'Erreur.');
  }
};

module.exports = {
  getAllSeries,
  getSerieById,
  createSerie,
  updateSerie,
  hideSerie,
  unhideSerie,
  deleteSerie,
  createSeason,
  createEpisode,
  updateEpisode,
  deleteEpisode,
  getNextEpisode,
  getSuggestedSeries,
};
