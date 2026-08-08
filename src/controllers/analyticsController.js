const { prisma } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// ===== SAUVEGARDER LES ANALYTICS =====
const saveAnalytics = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { watchedSeconds, totalSeconds, completed } = req.body;
    const userId = req.user.id;

    await prisma.movieAnalytic.upsert({
      where: { userId_movieId: { userId, movieId } },
      update: {
        watchedSeconds: parseInt(watchedSeconds),
        totalSeconds: parseInt(totalSeconds),
        completed: completed || false,
        updatedAt: new Date(),
      },
      create: {
        userId,
        movieId,
        watchedSeconds: parseInt(watchedSeconds),
        totalSeconds: parseInt(totalSeconds),
        completed: completed || false,
      },
    });

    return successResponse(res, {}, 'Analytics sauvegardées.');
  } catch (error) {
    console.error('Erreur saveAnalytics:', error);
    return errorResponse(res, 'Erreur lors de la sauvegarde.');
  }
};

// ===== ANALYTICS D'UN FILM (ADMIN) =====
const getMovieAnalytics = async (req, res) => {
  try {
    const { movieId } = req.params;

    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      select: { id: true, title: true, duration: true, views: true, likes: true },
    });

    if (!movie) {
      return errorResponse(res, 'Film non trouvé.', 404);
    }

    const analytics = await prisma.movieAnalytic.findMany({
      where: { movieId },
    });

    const totalWatchers = analytics.length;
    const completed = analytics.filter(a => a.completed).length;
    const completionRate = totalWatchers > 0
      ? Math.round((completed / totalWatchers) * 100)
      : 0;

    const avgWatchedSeconds = totalWatchers > 0
      ? Math.round(analytics.reduce((sum, a) => sum + a.watchedSeconds, 0) / totalWatchers)
      : 0;

    const avgRetentionRate = analytics.length > 0
      ? Math.round(analytics.reduce((sum, a) => {
          const rate = a.totalSeconds > 0 ? (a.watchedSeconds / a.totalSeconds) * 100 : 0;
          return sum + rate;
        }, 0) / analytics.length)
      : 0;

    return successResponse(res, {
      movie,
      stats: {
        totalViews: movie.views,
        totalLikes: movie.likes,
        totalWatchers,
        completed,
        completionRate,
        avgWatchedSeconds,
        avgWatchedMinutes: Math.round(avgWatchedSeconds / 60),
        avgRetentionRate,
      },
    }, 'Analytics récupérées.');
  } catch (error) {
    console.error('Erreur getMovieAnalytics:', error);
    return errorResponse(res, 'Erreur lors de la récupération.');
  }
};

// ===== ANALYTICS GLOBALES (ADMIN) =====
const getGlobalAnalytics = async (req, res) => {
  try {
    const [
      totalUsers,
      totalMovies,
      totalSeries,
      totalViews,
      totalLikes,
      topMovies,
      recentAnalytics,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.movie.count({ where: { isPublished: true } }),
      prisma.serie.count({ where: { isPublished: true } }),
      prisma.movie.aggregate({ _sum: { views: true } }),
      prisma.movie.aggregate({ _sum: { likes: true } }),
      prisma.movie.findMany({
        where: { isPublished: true },
        orderBy: { views: 'desc' },
        take: 5,
        select: {
          id: true, title: true, views: true, likes: true,
          category: { select: { name: true } },
        },
      }),
      prisma.movieAnalytic.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: {
          movie: { select: { title: true } },
        },
      }),
    ]);

    return successResponse(res, {
      stats: {
        totalUsers,
        totalMovies,
        totalSeries,
        totalViews: totalViews._sum.views || 0,
        totalLikes: totalLikes._sum.likes || 0,
      },
      topMovies,
      recentActivity: recentAnalytics.map(a => ({
        movieTitle: a.movie.title,
        watchedMinutes: Math.round(a.watchedSeconds / 60),
        completed: a.completed,
        updatedAt: a.updatedAt,
      })),
    }, 'Analytics globales récupérées.');
  } catch (error) {
    console.error('Erreur getGlobalAnalytics:', error);
    return errorResponse(res, 'Erreur lors de la récupération.');
  }
};

module.exports = { saveAnalytics, getMovieAnalytics, getGlobalAnalytics };