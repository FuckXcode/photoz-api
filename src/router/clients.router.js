const Router = require('koa-router');
const clientsController = require('../controller/clients.controller');
const { verifyAuth } = require('../middleware/auth.middleware');

const router = new Router({ prefix: '/api/admin' });

router.get('/clients', verifyAuth, clientsController.list);
router.post('/clients', verifyAuth, clientsController.create);
router.delete('/clients/:id', verifyAuth, clientsController.remove);

module.exports = router;
