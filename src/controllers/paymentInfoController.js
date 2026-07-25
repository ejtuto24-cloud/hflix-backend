const { prisma } = require('../config/database');
const {
  successResponse,
  errorResponse,
  validationError,
  notFoundResponse,
} = require('../utils/response');

// ===== OBTENIR TOUTES LES INFOS DE PAIEMENT =====
const getPaymentInfo = async (req, res) => {
  try {
    const paymentInfos = await prisma.paymentInfo.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    return successResponse(res, { paymentInfos }, 'Informations de paiement récupérées.');
  } catch (error) {
    console.error('Erreur getPaymentInfo:', error);
    return errorResponse(res, 'Erreur lors de la récupération.');
  }
};

// ===== CRÉER OU METTRE À JOUR (ADMIN) =====
const upsertPaymentInfo = async (req, res) => {
  try {
    const { method, number, holderName, bankName, instructions } = req.body;

    if (!method || !number || !holderName) {
      return validationError(res, 'Méthode, numéro et nom du titulaire sont obligatoires.');
    }

    const paymentInfo = await prisma.paymentInfo.upsert({
      where: { method },
      update: { number, holderName, bankName, instructions, isActive: true },
      create: { method, number, holderName, bankName, instructions },
    });

    return successResponse(res, { paymentInfo }, 'Informations de paiement sauvegardées.');
  } catch (error) {
    console.error('Erreur upsertPaymentInfo:', error);
    return errorResponse(res, 'Erreur lors de la sauvegarde.');
  }
};

// ===== DÉSACTIVER (ADMIN) =====
const deletePaymentInfo = async (req, res) => {
  try {
    const { method } = req.params;

    await prisma.paymentInfo.update({
      where: { method },
      data: { isActive: false },
    });

    return successResponse(res, {}, 'Information de paiement désactivée.');
  } catch (error) {
    console.error('Erreur deletePaymentInfo:', error);
    return errorResponse(res, 'Erreur lors de la désactivation.');
  }
};

module.exports = { getPaymentInfo, upsertPaymentInfo, deletePaymentInfo };