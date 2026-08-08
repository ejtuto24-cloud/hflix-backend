const { prisma } = require('../config/database');
const {
  successResponse,
  errorResponse,
  validationError,
} = require('../utils/response');

// Valeurs par défaut
const DEFAULTS = {
  subscription_price: '500',
  subscription_currency: 'HTG',
  subscription_days: '30',
  trial_minutes: '90',
};

// ===== OBTENIR LE PRIX (PUBLIC POUR UTILISATEURS) =====
const getSubscriptionPrice = async (req, res) => {
  try {
    const settings = await prisma.appSetting.findMany({
      where: {
        key: {
          in: ['subscription_price', 'subscription_currency', 'subscription_days'],
        },
      },
    });

    const map = {};
    settings.forEach(s => { map[s.key] = s.value; });

    return successResponse(res, {
      price: parseFloat(map.subscription_price || DEFAULTS.subscription_price),
      currency: map.subscription_currency || DEFAULTS.subscription_currency,
      days: parseInt(map.subscription_days || DEFAULTS.subscription_days),
    }, 'Prix récupéré.');
  } catch (error) {
    console.error('Erreur getSubscriptionPrice:', error);
    return errorResponse(res, 'Erreur lors de la récupération du prix.');
  }
};

// ===== TOUS LES PARAMÈTRES (ADMIN) =====
const getAllSettings = async (req, res) => {
  try {
    const settings = await prisma.appSetting.findMany({
      orderBy: { key: 'asc' },
    });

    const map = { ...DEFAULTS };
    settings.forEach(s => { map[s.key] = s.value; });

    return successResponse(res, { settings: map }, 'Paramètres récupérés.');
  } catch (error) {
    console.error('Erreur getAllSettings:', error);
    return errorResponse(res, 'Erreur lors de la récupération.');
  }
};

// ===== MODIFIER LES PARAMÈTRES (ADMIN) =====
const updateSettings = async (req, res) => {
  try {
    const { subscription_price, subscription_currency, subscription_days, trial_minutes } = req.body;

    const updates = [];

    if (subscription_price !== undefined) {
      const price = parseFloat(subscription_price);
      if (isNaN(price) || price <= 0) {
        return validationError(res, 'Le prix doit être un nombre positif.');
      }
      updates.push({ key: 'subscription_price', value: String(price) });
    }

    if (subscription_currency !== undefined) {
      updates.push({ key: 'subscription_currency', value: subscription_currency });
    }

    if (subscription_days !== undefined) {
      const days = parseInt(subscription_days);
      if (isNaN(days) || days <= 0) {
        return validationError(res, 'La durée doit être un nombre positif.');
      }
      updates.push({ key: 'subscription_days', value: String(days) });
    }

    if (trial_minutes !== undefined) {
      const minutes = parseInt(trial_minutes);
      if (isNaN(minutes) || minutes < 0) {
        return validationError(res, 'La durée d\'essai doit être un nombre positif.');
      }
      updates.push({ key: 'trial_minutes', value: String(minutes) });
    }

    for (const u of updates) {
      await prisma.appSetting.upsert({
        where: { key: u.key },
        update: { value: u.value },
        create: { key: u.key, value: u.value },
      });
    }

    const settings = await prisma.appSetting.findMany();
    const map = { ...DEFAULTS };
    settings.forEach(s => { map[s.key] = s.value; });

    return successResponse(res, { settings: map }, 'Paramètres mis à jour avec succès.');
  } catch (error) {
    console.error('Erreur updateSettings:', error);
    return errorResponse(res, 'Erreur lors de la mise à jour.');
  }
};

// ===== FONCTION UTILITAIRE POUR AUTRES CONTROLLERS =====
const getSetting = async (key) => {
  try {
    const setting = await prisma.appSetting.findUnique({ where: { key } });
    return setting ? setting.value : DEFAULTS[key];
  } catch (error) {
    return DEFAULTS[key];
  }
};

module.exports = {
  getSubscriptionPrice,
  getAllSettings,
  updateSettings,
  getSetting,
  DEFAULTS,
};