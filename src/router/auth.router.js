const Router = require('koa-router');
const authController = require('../controller/auth.controller');
const { verifyAuth } = require('../middleware/auth.middleware');

const router = new Router({ prefix: '/api/auth' });

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', verifyAuth, authController.logout);

module.exports = router;
