const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const { unauthorizedResponse } = require('../utils/response');

// ===== MIDDLEWARE DE VÉRIFICATION DU TOKEN =====
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse(res, 'Token manquant. Veuillez vous connecter.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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
    await authenticate(req, res, async () => {
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

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'Aucun abonnement trouvé. Veuillez vous abonner.',
        code: 'SUBSCRIPTION_EXPIRED',
      });
    }

    const now = new Date();

    // ===== PÉRIODE D'ESSAI GRATUITE =====
    if (subscription.status === 'TRIAL') {
      if (subscription.endDate && now > new Date(subscription.endDate)) {
        await prisma.subscription.update({
          where: { userId: req.user.id },
          data: { status: 'EXPIRED' },
        });
        return res.status(403).json({
          success: false,
          message: 'Votre période d\'essai gratuite de 1h30 est terminée. Abonnez-vous pour continuer à regarder.',
          code: 'TRIAL_EXPIRED',
        });
      }

      // Essai encore valide
      const minutesLeft = Math.floor((new Date(subscription.endDate) - now) / 60000);
      req.trialMinutesLeft = minutesLeft;
      req.isTrial = true;
      return next();
    }

    // ===== ABONNEMENT PAYANT =====
    if (subscription.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Votre abonnement est expiré. Veuillez renouveler votre abonnement.',
        code: 'SUBSCRIPTION_EXPIRED',
      });
    }

    if (subscription.endDate && now > new Date(subscription.endDate)) {
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
    console.error('Erreur checkSubscription:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de l\'abonnement.',
    });
  }
};

module.exports = { authenticate, authenticateAdmin, checkSubscription };