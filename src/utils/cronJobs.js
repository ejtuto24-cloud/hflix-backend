const cron = require('node-cron');
const { prisma } = require('../config/database');

const startCronJobs = () => {

  // ===== ESSAIS EXPIRÉS (toutes les 5 minutes) =====
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      const result = await prisma.subscription.updateMany({
        where: { status: 'TRIAL', endDate: { lt: now } },
        data: { status: 'EXPIRED' },
      });
      if (result.count > 0) {
        console.log(`⏰ ${result.count} essai(s) gratuit(s) expiré(s).`);
      }
    } catch (error) {
      console.error('❌ Erreur essais:', error);
    }
  });

  // ===== ABONNEMENTS EXPIRÉS (tous les jours à minuit) =====
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Vérification des abonnements expirés...');
    try {
      const now = new Date();
      const result = await prisma.subscription.updateMany({
        where: { status: 'ACTIVE', endDate: { lt: now } },
        data: { status: 'EXPIRED' },
      });
      console.log(`✅ ${result.count} abonnement(s) expiré(s).`);
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
      console.log(`✅ ${result.count} désinstallation(s) probable(s).`);
    } catch (error) {
      console.error('❌ Erreur désinstallations:', error);
    }
  });

  console.log('✅ Tâches automatiques démarrées.');
};

module.exports = { startCronJobs };