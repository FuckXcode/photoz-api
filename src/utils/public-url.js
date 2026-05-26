function buildPublicObjectUrl(baseUrl, objectKey, fallbackUrl = '') {
  if (!baseUrl || !objectKey) return fallbackUrl;
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedKey = objectKey
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/');
  return `${normalizedBase}/${normalizedKey}`;
}

module.exports = { buildPublicObjectUrl };
