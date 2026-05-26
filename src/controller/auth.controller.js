const { getSupabaseClient } = require('../utils/supabase-auth');
const { getSupabaseAdmin } = require('../utils/supabase-auth');
const { clearCachedToken } = require('../middleware/auth.middleware');
const pool = require('../app/database');
const { success, fail } = require('../utils/response');
const ErrorCode = require('../constants/error-codes');

class AuthController {
  async register(ctx) {
    const { email, password } = ctx.request.body ?? {};

    if (!email || !password) {
      ctx.body = fail(ErrorCode.INVALID_PARAMS, '请填写邮箱和密码');
      return;
    }

    const { rows } = await pool.query(
      `SELECT id FROM auth.users WHERE email = $1 LIMIT 1`,
      [email.toLowerCase().trim()],
    );
    if (rows.length > 0) {
      ctx.body = fail(ErrorCode.EMAIL_EXISTS, '该邮箱已注册，请直接登录');
      return;
    }

    const { data, error } = await getSupabaseClient().auth.signUp({ email, password });

    if (error) {
      ctx.body = fail(ErrorCode.INVALID_PARAMS, error.message);
      return;
    }

    if (!data.session) {
      ctx.body = success({ message: '注册成功，请查收确认邮件后再登录' });
      return;
    }

    ctx.body = success({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      user: { id: data.user.id, email: data.user.email },
    });
  }

  async login(ctx) {
    const { email, password } = ctx.request.body ?? {};

    if (!email || !password) {
      ctx.body = fail(ErrorCode.INVALID_PARAMS, '请填写邮箱和密码');
      return;
    }

    const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      ctx.body = fail(ErrorCode.INVALID_CREDENTIALS, '邮箱或密码不正确');
      return;
    }

    ctx.body = success({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      user: { id: data.user.id, email: data.user.email },
    });
  }

  async logout(ctx) {
    const token = ctx.headers['authorization']?.replace(/^Bearer\s+/i, '');

    const { error } = await getSupabaseAdmin().auth.admin.signOut(token, 'local');

    if (error) {
      ctx.body = fail(ErrorCode.SERVER_ERROR, error.message);
      return;
    }

    clearCachedToken(token);
    ctx.body = success({ ok: true });
  }
}

module.exports = new AuthController();
