const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const config = require('../app/config');

let s3Client = null;

function getR2Client() {
  if (s3Client) return s3Client;

  if (!config.R2_ACCOUNT_ID) throw new Error('缺少环境变量：R2_ACCOUNT_ID');
  if (!config.R2_ACCESS_KEY_ID) throw new Error('缺少环境变量：R2_ACCESS_KEY_ID');
  if (!config.R2_SECRET_ACCESS_KEY) throw new Error('缺少环境变量：R2_SECRET_ACCESS_KEY');

  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.R2_ACCESS_KEY_ID,
      secretAccessKey: config.R2_SECRET_ACCESS_KEY,
    },
  });

  return s3Client;
}

async function createPhotoUploadUrl({ photographerId, galleryId, fileName, contentType, variant }) {
  if (!config.R2_BUCKET) throw new Error('缺少环境变量：R2_BUCKET');
  if (!config.R2_PUBLIC_BASE_URL) throw new Error('缺少环境变量：R2_PUBLIC_BASE_URL');

  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]+/g, '-');
  const objectKey = [
    'photographers',
    photographerId,
    'galleries',
    galleryId,
    variant === 'original' ? 'originals' : 'previews',
    `${Date.now()}-${safeFileName}`,
  ].join('/');

  const command = new PutObjectCommand({
    Bucket: config.R2_BUCKET,
    Key: objectKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 60 * 5 });
  const publicUrl = `${config.R2_PUBLIC_BASE_URL.replace(/\/$/, '')}/${objectKey}`;

  return { objectKey, uploadUrl, publicUrl };
}

async function deleteStorageObject(objectKey) {
  if (!objectKey) return;
  if (!config.R2_BUCKET) return;

  await getR2Client().send(new DeleteObjectCommand({
    Bucket: config.R2_BUCKET,
    Key: objectKey,
  }));
}

module.exports = { createPhotoUploadUrl, deleteStorageObject };
