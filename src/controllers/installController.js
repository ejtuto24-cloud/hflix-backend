const { prisma } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// ===== ENREGISTRER L'INSTALLATION =====
const trackInstall = async (req, res) => {
  try {
    const { platform, appVersion } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { installDate: true },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        installDate: user?.installDate || new Date(),
        lastSeenAt: new Date(),
        uninstallDate: null,
        platform,
        appVersion,
      },
    });

    return successResponse(res, {}, 'Installation enregistrée.');
  } catch (error) {
    console.error('Erreur trackInstall:', error);
    return errorResponse(res, 'Erreur lors de l\'enregistrement.');
  }
};

// ===== METTRE À JOUR L'ACTIVITÉ =====
const trackActivity = async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { lastSeenAt: new Date(), uninstallDate: null },
    });
    return successResponse(res, {}, 'Activité enregistrée.');
  } catch (error) {
    return errorResponse(res, 'Erreur.');
  }
};

// ===== STATISTIQUES (ADMIN) =====
const getInstallStats = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalInstalls,
      installsLast7Days,
      activeLast7Days,
      probableUninstalls,
      androidUsers,
      iosUsers,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { installDate: { not: null } } }),
      prisma.user.count({ where: { installDate: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { lastSeenAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({
        where: {
          installDate: { not: null },
          lastSeenAt: { lt: thirtyDaysAgo },
        },
      }),
      prisma.user.count({ where: { platform: 'android' } }),
      prisma.user.count({ where: { platform: 'ios' } }),
      prisma.user.findMany({
        where: { installDate: { not: null } },
        orderBy: { installDate: 'desc' },
        take: 15,
        select: {
          id: true, name: true, email: true,
          installDate: true, lastSeenAt: true,
          uninstallDate: true, platform: true, appVersion: true,
        },
      }),
    ]);

    const retentionRate = totalInstalls > 0
      ? Math.round((activeLast7Days / totalInstalls) * 100)
      : 0;

    return successResponse(res, {
      stats: {
        totalInstalls,
        installsLast7Days,
        activeLast7Days,
        probableUninstalls,
        retentionRate,
        androidUsers,
        iosUsers,
      },
      recentUsers,
    }, 'Statistiques récupérées.');
  } catch (error) {
    console.error('Erreur getInstallStats:', error);
    return errorResponse(res, 'Erreur lors de la récupération.');
  }
};

module.exports = { trackInstall, trackActivity, getInstallStats };