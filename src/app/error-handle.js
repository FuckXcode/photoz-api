const { fail } = require('../utils/response');
const ErrorCode = require('../constants/error-codes');

const errorHandler = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = 200;
    ctx.body = fail(err.errorCode || ErrorCode.SERVER_ERROR, err.message || '服务器内部错误');
    ctx.app.emit('error', err, ctx);
  }
};

module.exports = errorHandler;
