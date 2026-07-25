const { prisma } = require('../config/database');
const {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationError,
} = require('../utils/response');

// ===== TABLEAU DE BORD =====
const getDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalActiveSubscriptions,
      totalPendingPayments,
      totalApprovedPayments,
      totalMovies,
      totalCategories,
      recentUsers,
      recentPayments,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.payment.findMany({ where: { status: 'APPROVED' } }),
      prisma.movie.count(),
      prisma.category.count(),
      prisma.user.findMany({
        where: { role: 'USER' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          subscription: {
            select: { status: true },
          },
        },
      }),
      prisma.payment.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    const totalRevenue = totalApprovedPayments.reduce(
      (sum, payment) => sum + payment.amount, 0
    );

    return successResponse(res, {
      stats: {
        totalUsers,
        totalActiveSubscriptions,
        totalPendingPayments,
        totalApprovedPayments: totalApprovedPayments.length,
        totalRevenue,
        totalMovies,
        totalCategories,
      },
      recentUsers,
      recentPayments,
    }, 'Tableau de bord récupéré avec succès.');

  } catch (error) {
    console.error('Erreur getDashboard:', error);
    return errorResponse(res, 'Erreur lors de la récupération du tableau de bord.');
  }
};

// ===== LISTE DES UTILISATEURS =====
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    const where = { role: 'USER' };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          isSuspended: true,
          createdAt: true,
          subscription: {
            select: { status: true, endDate: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return successResponse(res, {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    }, 'Utilisateurs récupérés avec succès.');

  } catch (error) {
    console.error('Erreur getAllUsers:', error);
    return errorResponse(res, 'Erreur lors de la récupération des utilisateurs.');
  }
};

// ===== SUSPENDRE UN UTILISATEUR =====
const suspendUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return notFoundResponse(res, 'Utilisateur non trouvé.');
    }

    await prisma.user.update({
      where: { id },
      data: { isSuspended: true },
    });

    return successResponse(res, {}, 'Utilisateur suspendu avec succès.');

  } catch (error) {
    console.error('Erreur suspendUser:', error);
    return errorResponse(res, 'Erreur lors de la suspension de l\'utilisateur.');
  }
};

// ===== RÉACTIVER UN UTILISATEUR =====
const activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return notFoundResponse(res, 'Utilisateur non trouvé.');
    }

    await prisma.user.update({
      where: { id },
      data: { isSuspended: false },
    });

    return successResponse(res, {}, 'Utilisateur réactivé avec succès.');

  } catch (error) {
    console.error('Erreur activateUser:', error);
    return errorResponse(res, 'Erreur lors de la réactivation de l\'utilisateur.');
  }
};

// ===== SUPPRIMER UN UTILISATEUR =====
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return notFoundResponse(res, 'Utilisateur non trouvé.');
    }

    await prisma.user.delete({ where: { id } });

    return successResponse(res, {}, 'Utilisateur supprimé avec succès.');

  } catch (error) {
    console.error('Erreur deleteUser:', error);
    return errorResponse(res, 'Erreur lors de la suppression de l\'utilisateur.');
  }
};

// ===== AJOUTER MESSAGE ADMIN =====
const createAdminMessage = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return validationError(res, 'Titre et contenu sont obligatoires.');
    }

    const message = await prisma.adminMessage.create({
      data: { title, content },
    });

    return successResponse(res, { message }, 'Message créé avec succès.', 201);

  } catch (error) {
    console.error('Erreur createAdminMessage:', error);
    return errorResponse(res, 'Erreur lors de la création du message.');
  }
};

// ===== VOIR TOUS LES MESSAGES =====
const getAllMessages = async (req, res) => {
  try {
    const messages = await prisma.adminMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, { messages }, 'Messages récupérés avec succès.');

  } catch (error) {
    console.error('Erreur getAllMessages:', error);
    return errorResponse(res, 'Erreur lors de la récupération des messages.');
  }
};

module.exports = {
  getDashboard,
  getAllUsers,
  suspendUser,
  activateUser,
  deleteUser,
  createAdminMessage,
  getAllMessages,
};