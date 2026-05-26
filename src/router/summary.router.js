const Router = require('koa-router');
const summaryController = require('../controller/summary.controller');
const { verifyAuth } = require('../middleware/auth.middleware');

const router = new Router({ prefix: '/api/admin' });

router.get('/summary', verifyAuth, summaryController.getSummary);

module.exports = router;
