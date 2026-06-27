// Réponse de succès
const successResponse = (res, data = {}, message = 'Succès', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

// Réponse d'erreur
const errorResponse = (res, message = 'Une erreur est survenue', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

// Réponse de validation
const validationError = (res, message = 'Données invalides') => {
  return res.status(400).json({
    success: false,
    message,
  });
};

// Réponse non autorisé
const unauthorizedResponse = (res, message = 'Non autorisé') => {
  return res.status(401).json({
    success: false,
    message,
  });
};

// Réponse non trouvé
const notFoundResponse = (res, message = 'Ressource non trouvée') => {
  return res.status(404).json({
    success: false,
    message,
  });
};

module.exports = {
  successResponse,
  errorResponse,
  validationError,
  unauthorizedResponse,
  notFoundResponse,
};