const ErrorCode = require('../constants/error-codes');

function success(data = null) {
  return { code: ErrorCode.SUCCESS, message: 'success', data };
}

function fail(code, message, data = null) {
  return { code, message, data };
}

module.exports = { success, fail };
