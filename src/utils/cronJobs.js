const cron = require('node-cron');
const { prisma } = require('../config/database');

// ===== VÉRIFICATION DES ABONNEMENTS EXPIRÉS =====
const startCronJobs = () => {

  // Tous les jours à minuit
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Vérification des abonnements expirés...');

    try {
      const now = new Date();

      // Trouver tous les abonnements actifs expirés
      const expiredSubscriptions = await prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
          endDate: { lt: now },
        },
      });

      if (expiredSubscriptions.length === 0) {
        console.log('✅ Aucun abonnement expiré trouvé.');
        return;
      }

      // Mettre à jour le statut
      await prisma.subscription.updateMany({
        where: {
          status: 'ACTIVE',
          endDate: { lt: now },
        },
        data: { status: 'EXPIRED' },
      });

      console.log(`✅ ${expiredSubscriptions.length} abonnement(s) marqué(s) comme expiré(s).`);

    } catch (error) {
      console.error('❌ Erreur lors de la vérification des abonnements:', error);
    }
  });

  console.log('✅ Tâches automatiques démarrées.');
};

module.exports = { startCronJobs };