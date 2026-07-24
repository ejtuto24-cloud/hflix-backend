// Importation du client Prisma
const { PrismaClient } = require('@prisma/client');

// Création d'une instance unique de Prisma
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Fonction pour connecter à la base de données
const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Base de données connectée avec succès');
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    process.exit(1);
  }
};

module.exports = { prisma, connectDatabase };