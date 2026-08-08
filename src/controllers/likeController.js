const { prisma } = require('../config/database');
const { successResponse, errorResponse, notFoundResponse } = require('../utils/response');

// ===== LIKER UN FILM =====
const likeMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user.id;

    const movie = await prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) return notFoundResponse(res, 'Film non trouvé.');

    const existingLike = await prisma.like.findUnique({
      where: { userId_movieId: { userId, movieId } },
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { userId_movieId: { userId, movieId } },
      });
      await prisma.movie.update({
        where: { id: movieId },
        data: { likes: { decrement: 1 } },
      });
      return successResponse(res, { liked: false }, 'Film retiré des likes.');
    } else {
      // Like
      await prisma.like.create({ data: { userId, movieId } });
      await prisma.movie.update({
        where: { id: movieId },
        data: { likes: { increment: 1 } },
      });
      return successResponse(res, { liked: true }, 'Film liké avec succès.');
    }
  } catch (error) {
    console.error('Erreur likeMovie:', error);
    return errorResponse(res, 'Erreur lors du like.');
  }
};

// ===== VÉRIFIER SI L'UTILISATEUR A LIKÉ =====
const checkLike = async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user.id;

    const like = await prisma.like.findUnique({
      where: { userId_movieId: { userId, movieId } },
    });

    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      select: { likes: true },
    });

    return successResponse(res, {
      liked: !!like,
      totalLikes: movie?.likes || 0,
    }, 'Statut du like récupéré.');
  } catch (error) {
    console.error('Erreur checkLike:', error);
    return errorResponse(res, 'Erreur.');
  }
};

// ===== MES FILMS LIKÉS =====
const getMyLikes = async (req, res) => {
  try {
    const userId = req.user.id;

    const likes = await prisma.like.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        movie: {
          include: { category: { select: { id: true, name: true } } },
        },
      },
    });

    const movies = likes.map(l => l.movie);
    return successResponse(res, { movies }, 'Films likés récupérés.');
  } catch (error) {
    console.error('Erreur getMyLikes:', error);
    return errorResponse(res, 'Erreur lors de la récupération.');
  }
};

module.exports = { likeMovie, checkLike, getMyLikes };