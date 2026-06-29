const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// ===== CONFIGURATION R2 =====
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// ===== UPLOADER UN FICHIER =====
const uploadFile = async (file, folder = 'videos') => {
  try {
    const extension = path.extname(file.originalname);
    const fileName = `${folder}/${uuidv4()}${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await r2Client.send(command);

    // Retourner l'URL publique
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
    return { success: true, url: publicUrl, key: fileName };

  } catch (error) {
    console.error('Erreur upload R2:', error);
    return { success: false, error: error.message };
  }
};

// ===== SUPPRIMER UN FICHIER =====
const deleteFile = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    return { success: true };

  } catch (error) {
    console.error('Erreur suppression R2:', error);
    return { success: false, error: error.message };
  }
};

// ===== GÉNÉRER URL SIGNÉE (pour streaming privé) =====
const getSignedStreamUrl = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(r2Client, command, { expiresIn });
    return { success: true, url };

  } catch (error) {
    console.error('Erreur URL signée R2:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { uploadFile, deleteFile, getSignedStreamUrl };