const { prisma } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// ===== ENREGISTRER UNE SESSION =====
const registerSession = async (req, res) => {
  try {
    const { deviceId, deviceName } = req.body;
    const userId = req.user.id;

    if (!deviceId) {
      return errorResponse(res, 'Device ID obligatoire.', 400);
    }

    const existingSessions = await prisma.userSession.findMany({
      where: { userId },
    });

    const otherSessions = existingSessions.filter(s => s.deviceId !== deviceId);

    if (otherSessions.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Votre compte est connecté sur un autre appareil.',
        code: 'DEVICE_CONFLICT',
        otherDevices: otherSessions.map(s => ({
          deviceName: s.deviceName || 'Appareil inconnu',
          lastSeen: s.lastSeen,
        })),
      });
    }

    await prisma.userSession.upsert({
      where: {
        userId_deviceId: { userId, deviceId },
      },
      update: {
        deviceName,
        lastSeen: new Date(),
      },
      create: {
        userId,
        deviceId,
        deviceName,
      },
    });

    return successResponse(res, {}, 'Session enregistrée.');

  } catch (error) {
    console.error('Erreur registerSession:', error);
    return errorResponse(res, 'Erreur lors de la session.');
  }
};

// ===== DÉCONNECTER TOUS LES AUTRES APPAREILS =====
const disconnectOtherDevices = async (req, res) => {
  try {
    const { deviceId } = req.body;
    const userId = req.user.id;

    await prisma.userSession.deleteMany({
      where: {
        userId,
        deviceId: { not: deviceId },
      },
    });

    await prisma.userSession.upsert({
      where: {
        userId_deviceId: { userId, deviceId },
      },
      update: { lastSeen: new Date() },
      create: { userId, deviceId },
    });

    return successResponse(res, {}, 'Autres appareils déconnectés.');

  } catch (error) {
    console.error('Erreur disconnectOtherDevices:', error);
    return errorResponse(res, 'Erreur.');
  }
};

// ===== DÉCONNECTER L'APPAREIL ACTUEL =====
const logoutDevice = async (req, res) => {
  try {
    const { deviceId } = req.body;
    const userId = req.user.id;

    await prisma.userSession.deleteMany({
      where: { userId, deviceId },
    });

    return successResponse(res, {}, 'Déconnecté avec succès.');

  } catch (error) {
    console.error('Erreur logoutDevice:', error);
    return errorResponse(res, 'Erreur.');
  }
};

module.exports = { registerSession, disconnectOtherDevices, logoutDevice };