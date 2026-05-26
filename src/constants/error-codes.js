const ErrorCode = {
  // ─── Success ──────────────────────────────────────────
  SUCCESS: 1000,

  // ─── Auth (2xxx) ──────────────────────────────────────
  AUTH_REQUIRED: 2001,       // missing token
  AUTH_INVALID: 2002,        // token expired or invalid
  EMAIL_EXISTS: 2003,        // duplicate registration
  INVALID_CREDENTIALS: 2004, // wrong email / password

  // ─── Validation (3xxx) ────────────────────────────────
  INVALID_PARAMS: 3001,      // missing or malformed params
  INVALID_MODE: 3002,        // gallery mode value not allowed

  // ─── Resource (4xxx) ──────────────────────────────────
  NOT_FOUND: 4001,           // resource does not exist

  // ─── Conflict (4xxx) ──────────────────────────────────
  CONFLICT: 4002,            // duplicate resource (e.g. email already registered)

  // ─── Server (5xxx) ────────────────────────────────────
  SERVER_ERROR: 5001,
};

module.exports = ErrorCode;
