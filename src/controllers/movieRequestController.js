const { prisma } = require('../config/database');
const {
  successResponse,
  errorResponse,
  validationError,
  notFoundResponse,
} = require('../utils/response');

// ===== FAIRE UNE DEMANDE =====
const createRequest = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return validationError(res, 'Le titre du film est obligatoire.');
    }

    // Vérifier le nombre de demandes ce mois
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const requestsThisMonth = await prisma.movieRequest.count({
      where: {
        userId: req.user.id,
        createdAt: { gte: startOfMonth },
      },
    });

    if (requestsThisMonth >= 3) {
      return errorResponse(res, 'Vous avez atteint la limite de 3 demandes par mois.', 429);
    }

    const request = await prisma.movieRequest.create({
      data: {
        userId: req.user.id,
        title,
        description,
      },
    });

    const remaining = 2 - requestsThisMonth;

    return successResponse(res, { request, remaining }, `Demande envoyée ! Il vous reste ${remaining} demande(s) ce mois.`, 201);

  } catch (error) {
    console.error('Erreur createRequest:', error);
    return errorResponse(res, 'Erreur lors de la création de la demande.');
  }
};

// ===== MES DEMANDES =====
const getMyRequests = async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [requests, requestsThisMonth] = await Promise.all([
      prisma.movieRequest.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.movieRequest.count({
        where: {
          userId: req.user.id,
          createdAt: { gte: startOfMonth },
        },
      }),
    ]);

    return successResponse(res, {
      requests,
      requestsThisMonth,
      remaining: Math.max(0, 3 - requestsThisMonth),
    }, 'Demandes récupérées.');

  } catch (error) {
    console.error('Erreur getMyRequests:', error);
    return errorResponse(res, 'Erreur lors de la récupération.');
  }
};

// ===== TOUTES LES DEMANDES (ADMIN) =====
const getAllRequests = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) where.status = status;

    const requests = await prisma.movieRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return successResponse(res, { requests }, 'Demandes récupérées.');

  } catch (error) {
    console.error('Erreur getAllRequests:', error);
    return errorResponse(res, 'Erreur lors de la récupération.');
  }
};

// ===== APPROUVER UNE DEMANDE (ADMIN) =====
const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.movieRequest.findUnique({ where: { id } });
    if (!request) {
      return notFoundResponse(res, 'Demande non trouvée.');
    }

    await prisma.movieRequest.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    return successResponse(res, {}, 'Demande approuvée.');

  } catch (error) {
    console.error('Erreur approveRequest:', error);
    return errorResponse(res, 'Erreur lors de l\'approbation.');
  }
};

// ===== REFUSER UNE DEMANDE (ADMIN) =====
const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.movieRequest.findUnique({ where: { id } });
    if (!request) {
      return notFoundResponse(res, 'Demande non trouvée.');
    }

    await prisma.movieRequest.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    return successResponse(res, {}, 'Demande refusée.');

  } catch (error) {
    console.error('Erreur rejectRequest:', error);
    return errorResponse(res, 'Erreur lors du refus.');
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getAllRequests,
  approveRequest,
  rejectRequest,
};
