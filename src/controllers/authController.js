const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const {
  successResponse,
  errorResponse,
  validationError,
  unauthorizedResponse,
} = require('../utils/response');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return validationError(res, 'Nom, email et mot de passe sont obligatoires.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return validationError(res, 'Format email invalide.');
    }
    if (password.length < 6) {
      return validationError(res, 'Le mot de passe doit contenir au moins 6 caractères.');
    }
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) {
      return validationError(res, 'Cet email est déjà utilisé.');
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase(), password: hashedPassword },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    await prisma.subscription.create({
      data: { userId: user.id, status: 'INACTIVE' },
    });
    const token = generateToken(user);
    return successResponse(res, { user, token }, 'Compte créé avec succès.', 201);
  } catch (error) {
    console.error('Erreur register:', error);
    return errorResponse(res, 'Erreur lors de la création du compte.');
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return validationError(res, 'Email et mot de passe sont obligatoires.');
    }
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      return unauthorizedResponse(res, 'Email ou mot de passe incorrect.');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return unauthorizedResponse(res, 'Email ou mot de passe incorrect.');
    }
    if (!user.isActive) {
      return unauthorizedResponse(res, 'Votre compte est désactivé.');
    }
    if (user.isSuspended) {
      return unauthorizedResponse(res, 'Votre compte est suspendu.');
    }
    const token = generateToken(user);
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };
    return successResponse(res, { user: userData, token }, 'Connexion réussie.');
  } catch (error) {
    console.error('Erreur login:', error);
    return errorResponse(res, 'Erreur lors de la connexion.');
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
        subscription: {
          select: { status: true, startDate: true, endDate: true },
        },
      },
    });
    return successResponse(res, { user }, 'Profil récupéré avec succès.');
  } catch (error) {
    console.error('Erreur getProfile:', error);
    return errorResponse(res, 'Erreur lors de la récupération du profil.');
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return validationError(res, 'Le nom est obligatoire.');
    }
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name },
      select: { id: true, name: true, email: true, avatar: true, role: true },
    });
    return successResponse(res, { user }, 'Profil mis à jour avec succès.');
  } catch (error) {
    console.error('Erreur updateProfile:', error);
    return errorResponse(res, 'Erreur lors de la mise à jour du profil.');
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return validationError(res, 'Mot de passe actuel et nouveau mot de passe sont obligatoires.');
    }
    if (newPassword.length < 6) {
      return validationError(res, 'Le nouveau mot de passe doit contenir au moins 6 caractères.');
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return unauthorizedResponse(res, 'Mot de passe actuel incorrect.');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });
    return successResponse(res, {}, 'Mot de passe changé avec succès.');
  } catch (error) {
    console.error('Erreur changePassword:', error);
    return errorResponse(res, 'Erreur lors du changement de mot de passe.');
  }
};

const deleteAccount = async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.user.id },
    });
    return successResponse(res, {}, 'Compte supprimé avec succès.');
  } catch (error) {
    console.error('Erreur deleteAccount:', error);
    return errorResponse(res, 'Erreur lors de la suppression du compte.');
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
};
