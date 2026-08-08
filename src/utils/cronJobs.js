const cron = require('node-cron');
const { prisma } = require('../config/database');

const startCronJobs = () => {

  // ===== ABONNEMENTS EXPIRÉS (tous les jours à minuit) =====
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Vérification des abonnements expirés...');
    try {
      const now = new Date();
      const expired = await prisma.subscription.findMany({
        where: { status: 'ACTIVE', endDate: { lt: now } },
      });

      if (expired.length === 0) {
        console.log('✅ Aucun abonnement expiré.');
        return;
      }

      await prisma.subscription.updateMany({
        where: { status: 'ACTIVE', endDate: { lt: now } },
        data: { status: 'EXPIRED' },
      });

      console.log(`✅ ${expired.length} abonnement(s) expiré(s).`);
    } catch (error) {
      console.error('❌ Erreur abonnements:', error);
    }
  });

  // ===== DÉSINSTALLATIONS PROBABLES (tous les jours à 1h) =====
  cron.schedule('0 1 * * *', async () => {
    console.log('⏰ Détection des désinstallations probables...');
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const result = await prisma.user.updateMany({
        where: {
          installDate: { not: null },
          lastSeenAt: { lt: thirtyDaysAgo },
          uninstallDate: null,
        },
        data: { uninstallDate: new Date() },
      });

      console.log(`✅ ${result.count} désinstallation(s) probable(s) détectée(s).`);
    } catch (error) {
      console.error('❌ Erreur désinstallations:', error);
    }
  });

  console.log('✅ Tâches automatiques démarrées.');
};

module.exports = { startCronJobs };