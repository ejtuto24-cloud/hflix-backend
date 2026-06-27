require('dotenv').config();
const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');

const createAdmin = async () => {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = 'Admin HFlix';

    // Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log('✅ Le compte admin existe déjà.');
      process.exit(0);
    }

    // Chiffrer le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'admin
    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    console.log('✅ Compte admin créé avec succès !');
    console.log(`📧 Email : ${admin.email}`);
    console.log(`🔑 Mot de passe : ${password}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors de la création du compte admin:', error);
    process.exit(1);
  }
};

createAdmin();