const { prisma } = require('../config/database');
const {
  successResponse,
  errorResponse,
  validationError,
  notFoundResponse,
} = require('../utils/response');

// ===== DEMANDE DE PAIEMENT =====
const createPayment = async (req, res) => {
  try {
    const { amount, method, transactionRef } = req.body;

    if (!amount || !method) {
      return validationError(res, 'Montant et méthode de paiement sont obligatoires.');
    }

    const validMethods = ['MONCASH', 'NATCASH', 'BANK_TRANSFER'];
    if (!validMethods.includes(method)) {
      return validationError(res, 'Méthode de paiement invalide.');
    }

    const payment = await prisma.payment.create({
      data: {
        userId: req.user.id,
        amount: parseFloat(amount),
        method,
        transactionRef,
        status: 'PENDING',
      },
    });

    return successResponse(res, { payment }, 'Demande de paiement créée. Veuillez uploader votre capture d\'écran.', 201);

  } catch (error) {
    console.error('Erreur createPayment:', error);
    return errorResponse(res, 'Erreur lors de la création du paiement.');
  }
};

// ===== UPLOADER CAPTURE D'ÉCRAN =====
const uploadScreenshot = async (req, res) => {
  try {
    const { id } = req.params;
    const { screenshot } = req.body;

    if (!screenshot) {
      return validationError(res, 'La capture d\'écran est obligatoire.');
    }

    const payment = await prisma.payment.findUnique({ where: { id } });

    if (!payment) {
      return notFoundResponse(res, 'Paiement non trouvé.');
    }

    if (payment.userId !== req.user.id) {
      return errorResponse(res, 'Non autorisé.', 403);
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        screenshot,
        status: 'PENDING',
      },
    });

    return successResponse(res, { payment: updatedPayment }, 'Capture d\'écran uploadée. En attente de validation.');

  } catch (error) {
    console.error('Erreur uploadScreenshot:', error);
    return errorResponse(res, 'Erreur lors de l\'upload de la capture d\'écran.');
  }
};

// ===== MES PAIEMENTS =====
const getMyPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, { payments }, 'Paiements récupérés avec succès.');

  } catch (error) {
    console.error('Erreur getMyPayments:', error);
    return errorResponse(res, 'Erreur lors de la récupération des paiements.');
  }
};

// ===== TOUS LES PAIEMENTS (ADMIN) =====
const getAllPayments = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return successResponse(res, { payments }, 'Paiements récupérés avec succès.');

  } catch (error) {
    console.error('Erreur getAllPayments:', error);
    return errorResponse(res, 'Erreur lors de la récupération des paiements.');
  }
};

// ===== APPROUVER UN PAIEMENT (ADMIN) =====
const approvePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!payment) {
      return notFoundResponse(res, 'Paiement non trouvé.');
    }

    if (payment.status === 'APPROVED') {
      return validationError(res, 'Ce paiement est déjà approuvé.');
    }

    // Calculer les dates d'abonnement
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    // Approuver le paiement
    await prisma.payment.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });

    // Activer l'abonnement
    await prisma.subscription.upsert({
      where: { userId: payment.userId },
      update: {
        status: 'ACTIVE',
        startDate,
        endDate,
      },
      create: {
        userId: payment.userId,
        status: 'ACTIVE',
        startDate,
        endDate,
      },
    });

    return successResponse(res, {}, 'Paiement approuvé. Abonnement activé pour 30 jours.');

  } catch (error) {
    console.error('Erreur approvePayment:', error);
    return errorResponse(res, 'Erreur lors de l\'approbation du paiement.');
  }
};

// ===== REFUSER UN PAIEMENT (ADMIN) =====
const rejectPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const payment = await prisma.payment.findUnique({ where: { id } });

    if (!payment) {
      return notFoundResponse(res, 'Paiement non trouvé.');
    }

    await prisma.payment.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        notes,
      },
    });

    return successResponse(res, {}, 'Paiement refusé.');

  } catch (error) {
    console.error('Erreur rejectPayment:', error);
    return errorResponse(res, 'Erreur lors du refus du paiement.');
  }
};

module.exports = {
  createPayment,
  uploadScreenshot,
  getMyPayments,
  getAllPayments,
  approvePayment,
  rejectPayment,
};