const { createHmac } = require('node:crypto');
const { SUPABASE_SERVICE_ROLE_KEY } = require('../app/config');

function getSigningSecret() {
  return SUPABASE_SERVICE_ROLE_KEY || 'photozhou-dev-secret';
}

function sign(value) {
  return createHmac('sha256', getSigningSecret()).update(value).digest('base64url').slice(0, 32);
}

function createShareToken(galleryId) {
  return `${galleryId}.${sign(galleryId)}`;
}

function parseShareToken(token) {
  const dotIndex = token.lastIndexOf('.');
  if (dotIndex === -1) return null;
  const galleryId = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  if (!galleryId || !signature) return null;
  if (sign(galleryId) !== signature) return null;
  return galleryId;
}

function slugify(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

module.exports = { createShareToken, parseShareToken, slugify };
