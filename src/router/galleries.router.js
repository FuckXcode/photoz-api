const Router = require('koa-router');
const galleriesController = require('../controller/galleries.controller');
const { verifyAuth } = require('../middleware/auth.middleware');

const router = new Router({ prefix: '/api/admin' });

router.get('/galleries', verifyAuth, galleriesController.list);
router.post('/galleries', verifyAuth, galleriesController.create);
router.get('/galleries/:id', verifyAuth, galleriesController.detail);
router.delete('/galleries/:id', verifyAuth, galleriesController.remove);
router.patch('/galleries/:id/mode', verifyAuth, galleriesController.updateMode);
router.post('/galleries/:id/publish', verifyAuth, galleriesController.publish);
router.post('/galleries/:id/upload-url', verifyAuth, galleriesController.getUploadUrl);
router.post('/galleries/:id/photos', verifyAuth, galleriesController.addPhotos);
router.delete('/galleries/:id/photos/:photoId', verifyAuth, galleriesController.deletePhoto);
router.get('/galleries/:id/selection.csv', verifyAuth, galleriesController.exportCsv);

module.exports = router;
