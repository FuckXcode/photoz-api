const { getSupabaseAdmin } = require('../utils/supabase-auth');
const { fail } = require('../utils/response');
const ErrorCode = require('../constants/error-codes');

const USER_CACHE_TTL_MS = 5 * 60 * 1000;
const verifiedUserCache = new Map();

function getTokenExpiration(token) {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof parsed.exp === 'number' ? parsed.exp * 1000 : null;
  } catch {
    return null;
  }
}

const verifyAuth = async (ctx, next) => {
  const authorization = ctx.headers['authorization'];
  const token = authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    ctx.status = 200;
    ctx.body = fail(ErrorCode.AUTH_REQUIRED, '请先登录');
    return;
  }

  const now = Date.now();
  const cached = verifiedUserCache.get(token);
  if (cached && cached.expiresAt > now) {
    ctx.user = cached.user;
    return next();
  }

  const { data, error } = await getSupabaseAdmin().auth.getUser(token);

  if (error || !data.user) {
    ctx.status = 200;
    ctx.body = fail(ErrorCode.AUTH_INVALID, '登录状态已失效');
    return;
  }

  const tokenExpiresAt = getTokenExpiration(token);
  const cacheExpiresAt = Math.min(
    now + USER_CACHE_TTL_MS,
    tokenExpiresAt ? Math.max(now, tokenExpiresAt - 30 * 1000) : now + USER_CACHE_TTL_MS,
  );

  verifiedUserCache.set(token, { user: data.user, expiresAt: cacheExpiresAt });
  ctx.user = data.user;
  return next();
};

function clearCachedToken(token) {
  if (token) verifiedUserCache.delete(token);
}

module.exports = { verifyAuth, clearCachedToken };
