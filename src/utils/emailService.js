const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// ===== ENVOYER CODE DE VÉRIFICATION =====
const sendVerificationEmail = async (email, code, name) => {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '🎬 HFlix - Vérification de votre email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; padding: 40px; border-radius: 16px;">
          <h1 style="color: #E50914; text-align: center;">🎬 HFlix</h1>
          <h2 style="color: #ffffff; text-align: center;">Vérification de votre email</h2>
          <p style="color: #888888;">Bonjour ${name},</p>
          <p style="color: #888888;">Voici votre code de vérification :</p>
          <div style="background-color: #1a1a1a; border: 2px solid #E50914; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <h1 style="color: #E50914; font-size: 48px; letter-spacing: 8px; margin: 0;">${code}</h1>
          </div>
          <p style="color: #888888;">Ce code expire dans <strong style="color: #ffffff;">10 minutes</strong>.</p>
          <p style="color: #888888;">Si vous n'avez pas créé de compte HFlix, ignorez cet email.</p>
          <hr style="border-color: #333333; margin: 24px 0;">
          <p style="color: #555555; text-align: center; font-size: 12px;">© 2024 HFlix Haiti. Tous droits réservés.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Erreur envoi email vérification:', error);
    return { success: false, error: error.message };
  }
};

// ===== ENVOYER LIEN MOT DE PASSE OUBLIÉ =====
const sendPasswordResetEmail = async (email, token, name) => {
  try {
    const resetLink = `${process.env.APP_URL || 'https://hflix.com'}/reset-password?token=${token}`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '🔑 HFlix - Réinitialisation de mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; padding: 40px; border-radius: 16px;">
          <h1 style="color: #E50914; text-align: center;">🎬 HFlix</h1>
          <h2 style="color: #ffffff; text-align: center;">Réinitialisation de mot de passe</h2>
          <p style="color: #888888;">Bonjour ${name},</p>
          <p style="color: #888888;">Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetLink}" style="background-color: #E50914; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              🔑 Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="color: #888888;">Ce lien expire dans <strong style="color: #ffffff;">1 heure</strong>.</p>
          <p style="color: #888888;">Si vous n'avez pas demandé de réinitialisation, ignorez cet email.</p>
          <hr style="border-color: #333333; margin: 24px 0;">
          <p style="color: #555555; text-align: center; font-size: 12px;">© 2024 HFlix Haiti. Tous droits réservés.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Erreur envoi email reset:', error);
    return { success: false, error: error.message };
  }
};

// ===== ENVOYER EMAIL DE BIENVENUE =====
const sendWelcomeEmail = async (email, name) => {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '🎬 Bienvenue sur HFlix !',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; padding: 40px; border-radius: 16px;">
          <h1 style="color: #E50914; text-align: center;">🎬 HFlix</h1>
          <h2 style="color: #ffffff; text-align: center;">Bienvenue ${name} !</h2>
          <p style="color: #888888;">Votre compte a été créé avec succès.</p>
          <p style="color: #888888;">Pour accéder aux films et séries, abonnez-vous dès maintenant.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://hflix.com" style="background-color: #E50914; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              🎬 Découvrir HFlix
            </a>
          </div>
          <hr style="border-color: #333333; margin: 24px 0;">
          <p style="color: #555555; text-align: center; font-size: 12px;">© 2024 HFlix Haiti. Tous droits réservés.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Erreur envoi email bienvenue:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};