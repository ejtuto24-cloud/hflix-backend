const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const { unauthorizedResponse } = require('../utils/response');

// ===== MIDDLEWARE DE VÉRIFICATION DU TOKEN =====
const authenticate = async (req, res, next) => {
  try {
    // Récupérer le token dans le header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse(res, 'Token manquant. Veuillez vous connecter.');
    }

    // Extraire le token
    const token = authHeader.split(' ')[1];

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Vérifier que l'utilisateur existe encore
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isSuspended: true,
      },
    });

    if (!user) {
      return unauthorizedResponse(res, 'Utilisateur non trouvé.');
    }

    if (!user.isActive) {
      return unauthorizedResponse(res, 'Votre compte est désactivé.');
    }

    if (user.isSuspended) {
      return unauthorizedResponse(res, 'Votre compte est suspendu.');
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return unauthorizedResponse(res, 'Token invalide.');
    }
    if (error.name === 'TokenExpiredError') {
      return unauthorizedResponse(res, 'Token expiré. Veuillez vous reconnecter.');
    }
    return unauthorizedResponse(res, 'Erreur d\'authentification.');
  }
};

// ===== MIDDLEWARE ADMIN UNIQUEMENT =====
const authenticateAdmin = async (req, res, next) => {
  try {
    // D'abord vérifier le token
    await authenticate(req, res, async () => {
      // Vérifier que c'est un admin
      if (req.user.role !== 'ADMIN') {
        return unauthorizedResponse(res, 'Accès réservé aux administrateurs.');
      }
      next();
    });
  } catch (error) {
    return unauthorizedResponse(res, 'Erreur d\'authentification admin.');
  }
};

// ===== MIDDLEWARE VÉRIFICATION ABONNEMENT =====
const checkSubscription = async (req, res, next) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user.id },
    });

    if (!subscription || subscription.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Votre abonnement est expiré. Veuillez renouveler votre abonnement.',
        code: 'SUBSCRIPTION_EXPIRED',
      });
    }

    // Vérifier la date d'expiration
    if (subscription.endDate && new Date() > new Date(subscription.endDate)) {
      // Mettre à jour le statut automatiquement
      await prisma.subscription.update({
        where: { userId: req.user.id },
        data: { status: 'EXPIRED' },
      });

      return res.status(403).json({
        success: false,
        message: 'Votre abonnement est expiré. Veuillez renouveler votre abonnement.',
        code: 'SUBSCRIPTION_EXPIRED',
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de l\'abonnement.',
    });
  }
};

module.exports = { authenticate, authenticateAdmin, checkSubscription };