const { prisma } = require('../config/database');
const {
  successResponse,
  errorResponse,
  validationError,
  notFoundResponse,
} = require('../utils/response');

// ===== ANNONCES ACTIVES (UTILISATEUR) =====
const getActiveAnnouncements = async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, { announcements }, 'Annonces récupérées.');
  } catch (error) {
    console.error('Erreur getActiveAnnouncements:', error);
    return errorResponse(res, 'Erreur lors de la récupération.');
  }
};

// ===== ENREGISTRER UNE VUE =====
const trackView = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.announcement.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
    return successResponse(res, {}, 'Vue enregistrée.');
  } catch (error) {
    return errorResponse(res, 'Erreur.');
  }
};

// ===== ENREGISTRER UN CLIC =====
const trackClick = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.announcement.update({
      where: { id },
      data: { clicks: { increment: 1 } },
    });
    return successResponse(res, {}, 'Clic enregistré.');
  } catch (error) {
    return errorResponse(res, 'Erreur.');
  }
};

// ===== TOUTES LES ANNONCES (ADMIN) =====
const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, { announcements }, 'Annonces récupérées.');
  } catch (error) {
    console.error('Erreur getAllAnnouncements:', error);
    return errorResponse(res, 'Erreur lors de la récupération.');
  }
};

// ===== CRÉER UNE ANNONCE (ADMIN) =====
const createAnnouncement = async (req, res) => {
  try {
    const { title, content, image, buttonText, buttonLink } = req.body;

    if (!title || !content) {
      return validationError(res, 'Le titre et le contenu sont obligatoires.');
    }

    const announcement = await prisma.announcement.create({
      data: { title, content, image, buttonText, buttonLink, isActive: true },
    });

    return successResponse(res, { announcement }, 'Annonce créée avec succès.', 201);
  } catch (error) {
    console.error('Erreur createAnnouncement:', error);
    return errorResponse(res, 'Erreur lors de la création.');
  }
};

// ===== MODIFIER UNE ANNONCE (ADMIN) =====
const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, image, buttonText, buttonLink, isActive } = req.body;

    const announcement = await prisma.announcement.update({
      where: { id },
      data: { title, content, image, buttonText, buttonLink, isActive },
    });

    return successResponse(res, { announcement }, 'Annonce mise à jour.');
  } catch (error) {
    console.error('Erreur updateAnnouncement:', error);
    return errorResponse(res, 'Erreur lors de la mise à jour.');
  }
};

// ===== SUPPRIMER UNE ANNONCE (ADMIN) =====
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.announcement.delete({ where: { id } });
    return successResponse(res, {}, 'Annonce supprimée.');
  } catch (error) {
    console.error('Erreur deleteAnnouncement:', error);
    return errorResponse(res, 'Erreur lors de la suppression.');
  }
};

// ===== BANNIÈRES ACTIVES (UTILISATEUR) =====
const getActiveBanners = async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
    return successResponse(res, { banners }, 'Bannières récupérées.');
  } catch (error) {
    console.error('Erreur getActiveBanners:', error);
    return errorResponse(res, 'Erreur lors de la récupération.');
  }
};

// ===== TOUTES LES BANNIÈRES (ADMIN) =====
const getAllBanners = async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { order: 'asc' },
    });
    return successResponse(res, { banners }, 'Bannières récupérées.');
  } catch (error) {
    console.error('Erreur getAllBanners:', error);
    return errorResponse(res, 'Erreur lors de la récupération.');
  }
};

// ===== CRÉER UNE BANNIÈRE (ADMIN) =====
const createBanner = async (req, res) => {
  try {
    const { title, image, link, order } = req.body;

    if (!title || !image) {
      return validationError(res, 'Le titre et l\'image sont obligatoires.');
    }

    const banner = await prisma.banner.create({
      data: {
        title, image, link,
        order: order ? parseInt(order) : 0,
        isActive: true,
      },
    });

    return successResponse(res, { banner }, 'Bannière créée avec succès.', 201);
  } catch (error) {
    console.error('Erreur createBanner:', error);
    return errorResponse(res, 'Erreur lors de la création.');
  }
};

// ===== MODIFIER UNE BANNIÈRE (ADMIN) =====
const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, image, link, order, isActive } = req.body;

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        title, image, link,
        order: order !== undefined ? parseInt(order) : undefined,
        isActive,
      },
    });

    return successResponse(res, { banner }, 'Bannière mise à jour.');
  } catch (error) {
    console.error('Erreur updateBanner:', error);
    return errorResponse(res, 'Erreur lors de la mise à jour.');
  }
};

// ===== SUPPRIMER UNE BANNIÈRE (ADMIN) =====
const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.banner.delete({ where: { id } });
    return successResponse(res, {}, 'Bannière supprimée.');
  } catch (error) {
    console.error('Erreur deleteBanner:', error);
    return errorResponse(res, 'Erreur lors de la suppression.');
  }
};

module.exports = {
  getActiveAnnouncements,
  trackView,
  trackClick,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};