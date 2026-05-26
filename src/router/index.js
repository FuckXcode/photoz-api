const authRouter = require('./auth.router');
const clientsRouter = require('./clients.router');
const galleriesRouter = require('./galleries.router');
const shareRouter = require('./share.router');
const summaryRouter = require('./summary.router');

function useRoutes(app) {
  [authRouter, clientsRouter, galleriesRouter, shareRouter, summaryRouter].forEach((router) => {
    app.use(router.routes());
    app.use(router.allowedMethods());
  });
}

module.exports = useRoutes;
