const { prisma } = require('../config/database');
const {
  successResponse,
  errorResponse,
  validationError,
  notFoundResponse,
} = require('../utils/response');

// ===== TOUS LES FILMS =====
const getAllMovies = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const skip = (page - 1) * limit;

    const where = { isPublished: true };

    if (category) {
      where.categoryId = category;
    }

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [movies, total] = await Promise.all([
      prisma.movie.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.movie.count({ where }),
    ]);

    return successResponse(res, {
      movies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    }, 'Films récupérés avec succès.');

  } catch (error) {
    console.error('Erreur getAllMovies:', error);
    return errorResponse(res, 'Erreur lors de la récupération des films.');
  }
};

// ===== UN SEUL FILM =====
const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;

    const movie = await prisma.movie.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        subtitles: true,
      },
    });

    if (!movie) {
      return notFoundResponse(res, 'Film non trouvé.');
    }

    // Incrémenter les vues
    await prisma.movie.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return successResponse(res, { movie }, 'Film récupéré avec succès.');

  } catch (error) {
    console.error('Erreur getMovieById:', error);
    return errorResponse(res, 'Erreur lors de la récupération du film.');
  }
};

// ===== FILMS POPULAIRES =====
const getPopularMovies = async (req, res) => {
  try {
    const movies = await prisma.movie.findMany({
      where: { isPublished: true },
      orderBy: { views: 'desc' },
      take: 10,
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    return successResponse(res, { movies }, 'Films populaires récupérés.');

  } catch (error) {
    console.error('Erreur getPopularMovies:', error);
    return errorResponse(res, 'Erreur lors de la récupération des films populaires.');
  }
};

// ===== NOUVEAUTÉS =====
const getNewMovies = async (req, res) => {
  try {
    const movies = await prisma.movie.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    return successResponse(res, { movies }, 'Nouveautés récupérées.');

  } catch (error) {
    console.error('Erreur getNewMovies:', error);
    return errorResponse(res, 'Erreur lors de la récupération des nouveautés.');
  }
};

// ===== FILMS EN VEDETTE =====
const getFeaturedMovies = async (req, res) => {
  try {
    const movies = await prisma.movie.findMany({
      where: { isPublished: true, isFeatured: true },
      take: 5,
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    return successResponse(res, { movies }, 'Films en vedette récupérés.');

  } catch (error) {
    console.error('Erreur getFeaturedMovies:', error);
    return errorResponse(res, 'Erreur lors de la récupération des films en vedette.');
  }
};

// ===== AJOUTER UN FILM (ADMIN) =====
const createMovie = async (req, res) => {
  try {
    const {
      title,
      description,
      categoryId,
      thumbnail,
      banner,
      videoUrl,
      trailerUrl,
      duration,
      releaseYear,
      isFeatured,
    } = req.body;

    if (!title || !categoryId) {
      return validationError(res, 'Le titre et la catégorie sont obligatoires.');
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return notFoundResponse(res, 'Catégorie non trouvée.');
    }

    const movie = await prisma.movie.create({
      data: {
        title,
        description,
        categoryId,
        thumbnail,
        banner,
        videoUrl,
        trailerUrl,
        duration: duration ? parseInt(duration) : null,
        releaseYear: releaseYear ? parseInt(releaseYear) : null,
        isFeatured: isFeatured || false,
        isPublished: true,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    return successResponse(res, { movie }, 'Film ajouté avec succès.', 201);

  } catch (error) {
    console.error('Erreur createMovie:', error);
    return errorResponse(res, 'Erreur lors de la création du film.');
  }
};

// ===== MODIFIER UN FILM (ADMIN) =====
const updateMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      categoryId,
      thumbnail,
      banner,
      videoUrl,
      trailerUrl,
      duration,
      releaseYear,
      isFeatured,
      isPublished,
    } = req.body;

    const existingMovie = await prisma.movie.findUnique({ where: { id } });

    if (!existingMovie) {
      return notFoundResponse(res, 'Film non trouvé.');
    }

    const movie = await prisma.movie.update({
      where: { id },
      data: {
        title,
        description,
        categoryId,
        thumbnail,
        banner,
        videoUrl,
        trailerUrl,
        duration: duration ? parseInt(duration) : undefined,
        releaseYear: releaseYear ? parseInt(releaseYear) : undefined,
        isFeatured,
        isPublished,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    return successResponse(res, { movie }, 'Film mis à jour avec succès.');

  } catch (error) {
    console.error('Erreur updateMovie:', error);
    return errorResponse(res, 'Erreur lors de la mise à jour du film.');
  }
};

// ===== SUPPRIMER UN FILM (ADMIN) =====
const deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;

    const existingMovie = await prisma.movie.findUnique({ where: { id } });

    if (!existingMovie) {
      return notFoundResponse(res, 'Film non trouvé.');
    }

    await prisma.movie.delete({ where: { id } });

    return successResponse(res, {}, 'Film supprimé avec succès.');

  } catch (error) {
    console.error('Erreur deleteMovie:', error);
    return errorResponse(res, 'Erreur lors de la suppression du film.');
  }
};

module.exports = {
  getAllMovies,
  getMovieById,
  getPopularMovies,
  getNewMovies,
  getFeaturedMovies,
  createMovie,
  updateMovie,
  deleteMovie,
};