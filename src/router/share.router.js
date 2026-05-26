const Router = require('koa-router');
const shareController = require('../controller/share.controller');

const router = new Router({ prefix: '/api/share' });

router.get('/:token', shareController.getPublicGallery);
router.post('/:token/selection', shareController.submitSelection);

module.exports = router;
