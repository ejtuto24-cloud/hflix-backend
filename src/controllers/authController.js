const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../config/database');
const {
  successResponse,
  errorResponse,
  validationError,
  unauthorizedResponse,
} = require('../utils/response');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} = require('../utils/emailService');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// ===== CRÉER UN COMPTE =====
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
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.emailVerification.create({
      data: { email: email.toLowerCase(), code, expiresAt },
    });
    await sendVerificationEmail(email, code, name);
    const token = generateToken(user);
    return successResponse(res, { user, token }, 'Compte créé. Vérifiez votre email.', 201);
  } catch (error) {
    console.error('Erreur register:', error);
    return errorResponse(res, 'Erreur lors de la création du compte.');
  }
};

// ===== VÉRIFIER EMAIL =====
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return validationError(res, 'Email et code sont obligatoires.');
    }
    const verification = await prisma.emailVerification.findFirst({
      where: { email: email.toLowerCase(), code },
    });
    if (!verification) {
      return validationError(res, 'Code invalide.');
    }
    if (new Date() > verification.expiresAt) {
      return validationError(res, 'Code expiré. Demandez un nouveau code.');
    }
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { isEmailVerified: true },
    });
    await prisma.emailVerification.deleteMany({
      where: { email: email.toLowerCase() },
    });
    await sendWelcomeEmail(email, '');
    return successResponse(res, {}, 'Email vérifié avec succès.');
  } catch (error) {
    console.error('Erreur verifyEmail:', error);
    return errorResponse(res, 'Erreur lors de la vérification.');
  }
};

// ===== RENVOYER CODE =====
const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return validationError(res, 'Email obligatoire.');
    }
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      return validationError(res, 'Utilisateur non trouvé.');
    }
    if (user.isEmailVerified) {
      return validationError(res, 'Email déjà vérifié.');
    }
    await prisma.emailVerification.deleteMany({
      where: { email: email.toLowerCase() },
    });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.emailVerification.create({
      data: { email: email.toLowerCase(), code, expiresAt },
    });
    await sendVerificationEmail(email, code, user.name);
    return successResponse(res, {}, 'Nouveau code envoyé.');
  } catch (error) {
    console.error('Erreur resendCode:', error);
    return errorResponse(res, 'Erreur lors de l\'envoi.');
  }
};

// ===== CONNEXION =====
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
      isEmailVerified: user.isEmailVerified,
    };
    return successResponse(res, { user: userData, token }, 'Connexion réussie.');
  } catch (error) {
    console.error('Erreur login:', error);
    return errorResponse(res, 'Erreur lors de la connexion.');
  }
};

// ===== MOT DE PASSE OUBLIÉ =====
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return validationError(res, 'Email obligatoire.');
    }
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      return successResponse(res, {}, 'Si cet email existe, vous recevrez un lien.');
    }
    await prisma.passwordReset.deleteMany({
      where: { email: email.toLowerCase() },
    });
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordReset.create({
      data: { email: email.toLowerCase(), token, expiresAt },
    });
    await sendPasswordResetEmail(email, token, user.name);
    return successResponse(res, {}, 'Lien de réinitialisation envoyé.');
  } catch (error) {
    console.error('Erreur forgotPassword:', error);
    return errorResponse(res, 'Erreur lors de l\'envoi.');
  }
};

// ===== RÉINITIALISER MOT DE PASSE =====
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return validationError(res, 'Token et nouveau mot de passe obligatoires.');
    }
    if (newPassword.length < 6) {
      return validationError(res, 'Le mot de passe doit contenir au moins 6 caractères.');
    }
    const resetRequest = await prisma.passwordReset.findUnique({
      where: { token },
    });
    if (!resetRequest) {
      return validationError(res, 'Token invalide.');
    }
    if (new Date() > resetRequest.expiresAt) {
      return validationError(res, 'Token expiré. Demandez un nouveau lien.');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { email: resetRequest.email },
      data: { password: hashedPassword },
    });
    await prisma.passwordReset.delete({ where: { token } });
    return successResponse(res, {}, 'Mot de passe réinitialisé avec succès.');
  } catch (error) {
    console.error('Erreur resetPassword:', error);
    return errorResponse(res, 'Erreur lors de la réinitialisation.');
  }
};

// ===== MON PROFIL =====
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
        isEmailVerified: true,
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

// ===== MODIFIER PROFIL =====
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

// ===== CHANGER MOT DE PASSE =====
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return validationError(res, 'Mot de passe actuel et nouveau mot de passe sont obligatoires.');
    }
    if (newPassword.length < 6) {
      return validationError(res, 'Le nouveau mot de passe doit contenir au moins 6 caractères.');
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
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

// ===== SUPPRIMER COMPTE =====
const deleteAccount = async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.user.id } });
    return successResponse(res, {}, 'Compte supprimé avec succès.');
  } catch (error) {
    console.error('Erreur deleteAccount:', error);
    return errorResponse(res, 'Erreur lors de la suppression du compte.');
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerificationCode,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
};
