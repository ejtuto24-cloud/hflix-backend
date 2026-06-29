const { uploadFile, deleteFile } = require('../config/r2');
const { prisma } = require('../config/database');
const {
  successResponse,
  errorResponse,
  notFoundResponse,
} = require('../utils/response');

// ===== UPLOADER UNE VIDÉO =====
const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'Aucun fichier reçu.', 400);
    }

    const { movieId } = req.params;

    // Vérifier que le film existe
    const movie = await prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) {
      return notFoundResponse(res, 'Film non trouvé.');
    }

    // Uploader vers R2
    const result = await uploadFile(req.file, 'videos');

    if (!result.success) {
      return errorResponse(res, 'Erreur lors de l\'upload de la vidéo.');
    }

    // Supprimer l'ancienne vidéo si elle existe
    if (movie.videoUrl && movie.videoKey) {
      await deleteFile(movie.videoKey);
    }

    // Mettre à jour le film
    const updatedMovie = await prisma.movie.update({
      where: { id: movieId },
      data: {
        videoUrl: result.url,
      },
    });

    return successResponse(res, {
      movie: updatedMovie,
      videoUrl: result.url,
    }, 'Vidéo uploadée avec succès.');

  } catch (error) {
    console.error('Erreur uploadVideo:', error);
    return errorResponse(res, 'Erreur lors de l\'upload de la vidéo.');
  }
};

// ===== UPLOADER UNE MINIATURE =====
const uploadThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'Aucun fichier reçu.', 400);
    }

    const { movieId } = req.params;

    const movie = await prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) {
      return notFoundResponse(res, 'Film non trouvé.');
    }

    // Uploader vers R2
    const result = await uploadFile(req.file, 'thumbnails');

    if (!result.success) {
      return errorResponse(res, 'Erreur lors de l\'upload de la miniature.');
    }

    // Mettre à jour le film
    const updatedMovie = await prisma.movie.update({
      where: { id: movieId },
      data: {
        thumbnail: result.url,
      },
    });

    return successResponse(res, {
      movie: updatedMovie,
      thumbnailUrl: result.url,
    }, 'Miniature uploadée avec succès.');

  } catch (error) {
    console.error('Erreur uploadThumbnail:', error);
    return errorResponse(res, 'Erreur lors de l\'upload de la miniature.');
  }
};

// ===== UPLOADER UNE BANNIÈRE =====
const uploadBanner = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'Aucun fichier reçu.', 400);
    }

    const { movieId } = req.params;

    const movie = await prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) {
      return notFoundResponse(res, 'Film non trouvé.');
    }

    // Uploader vers R2
    const result = await uploadFile(req.file, 'banners');

    if (!result.success) {
      return errorResponse(res, 'Erreur lors de l\'upload de la bannière.');
    }

    // Mettre à jour le film
    const updatedMovie = await prisma.movie.update({
      where: { id: movieId },
      data: {
        banner: result.url,
      },
    });

    return successResponse(res, {
      movie: updatedMovie,
      bannerUrl: result.url,
    }, 'Bannière uploadée avec succès.');

  } catch (error) {
    console.error('Erreur uploadBanner:', error);
    return errorResponse(res, 'Erreur lors de l\'upload de la bannière.');
  }
};

// ===== UPLOADER CAPTURE D'ÉCRAN PAIEMENT =====
const uploadPaymentScreenshot = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'Aucun fichier reçu.', 400);
    }

    const { paymentId } = req.params;

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      return notFoundResponse(res, 'Paiement non trouvé.');
    }

    if (payment.userId !== req.user.id) {
      return errorResponse(res, 'Non autorisé.', 403);
    }

    // Uploader vers R2
    const result = await uploadFile(req.file, 'screenshots');

    if (!result.success) {
      return errorResponse(res, 'Erreur lors de l\'upload de la capture d\'écran.');
    }

    // Mettre à jour le paiement
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        screenshot: result.url,
        status: 'PENDING',
      },
    });

    return successResponse(res, {
      payment: updatedPayment,
      screenshotUrl: result.url,
    }, 'Capture d\'écran uploadée. En attente de validation.');

  } catch (error) {
    console.error('Erreur uploadPaymentScreenshot:', error);
    return errorResponse(res, 'Erreur lors de l\'upload de la capture d\'écran.');
  }
};

module.exports = {
  uploadVideo,
  uploadThumbnail,
  uploadBanner,
  uploadPaymentScreenshot,
};