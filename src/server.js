// Chargement des variables d'environnement
require('dotenv').config();

// Importations
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { connectDatabase } = require('./config/database');
const { startCronJobs } = require('./utils/cronJobs');

// Création de l'application Express
const app = express();

// Port du serveur
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARES DE SÉCURITÉ =====

// Protection contre les attaques courantes
app.use(helmet());

// Autoriser les requêtes depuis d'autres applications
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ===== MIDDLEWARES DE BASE =====

// Lire le JSON des requêtes
app.use(express.json());

// Lire les données des formulaires
app.use(express.urlencoded({ extended: true }));

// Afficher les logs des requêtes dans le terminal
app.use(morgan('dev'));

// Servir les fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ===== IMPORTATION DES ROUTES =====
const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

// ===== CONNEXION DES ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// ===== ROUTE DE TEST =====
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎬 Bienvenue sur l\'API HFlix !',
    version: '1.0.0',
    status: 'Serveur en ligne',
  });
});

// ===== DÉMARRAGE DU SERVEUR =====
const startServer = async () => {
  try {
    // Connexion à la base de données
    await connectDatabase();

    // Démarrage des tâches automatiques
    startCronJobs();

    // Démarrage du serveur
    app.listen(PORT, () => {
      console.log(`🚀 Serveur HFlix démarré sur le port ${PORT}`);
      console.log(`📡 URL : http://localhost:${PORT}`);
      console.log(`🌍 Environnement : ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
};

// Lancer le serveur
startServer();